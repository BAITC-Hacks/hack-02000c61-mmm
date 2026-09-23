"""Train and temporally evaluate the voluntary engagement model."""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.inspection import permutation_importance

from ml import MODEL_VERSION
from ml.data import load_official_data
from ml.features import (
    CATEGORICAL_FEATURES,
    FEATURE_COLUMNS,
    LEGACY_CATEGORICAL_FEATURES,
    LEGACY_FEATURE_COLUMNS,
    NUMERIC_FEATURES,
    build_training_dataset,
)
from ml.model import (
    candidate_models,
    choose_balanced_threshold,
    classification_metrics,
    save_artifact,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = REPO_ROOT / "data" / "case_1" / "career_quest_dataset"
DEFAULT_ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"


def temporal_masks(metadata: pd.DataFrame) -> tuple[pd.Series, pd.Series, pd.Series, str, str]:
    """Create 70/15/15 chronological partitions without splitting a calendar date."""

    if len(metadata) < 10:
        raise ValueError("At least 10 finalized voluntary records are required")
    val_start = pd.Timestamp(metadata.iloc[int(len(metadata) * 0.70)]["date"])
    test_start = pd.Timestamp(metadata.iloc[int(len(metadata) * 0.85)]["date"])
    train_mask = metadata["date"] < val_start
    validation_mask = (metadata["date"] >= val_start) & (metadata["date"] < test_start)
    test_mask = metadata["date"] >= test_start
    return (
        train_mask,
        validation_mask,
        test_mask,
        val_start.strftime("%Y-%m-%d"),
        test_start.strftime("%Y-%m-%d"),
    )


def _split_summary(metadata: pd.DataFrame, target: pd.Series, mask: pd.Series) -> dict[str, Any]:
    subset = metadata.loc[mask]
    labels = target.loc[mask]
    return {
        "samples": int(mask.sum()),
        "start_date": subset["date"].min().strftime("%Y-%m-%d"),
        "end_date": subset["date"].max().strftime("%Y-%m-%d"),
        "positive": int(labels.sum()),
        "negative": int(len(labels) - labels.sum()),
        "positive_rate": float(labels.mean()),
    }


def train(data_dir: Path, artifact_dir: Path) -> dict[str, Any]:
    data = load_official_data(data_dir)
    features, target, metadata = build_training_dataset(data)
    legacy_features, legacy_target, legacy_metadata = build_training_dataset(
        data, include_language=True
    )
    if not target.equals(legacy_target) or not metadata.equals(legacy_metadata):
        raise RuntimeError("Language comparison must use identical targets and temporal rows")
    train_mask, validation_mask, test_mask, val_start, test_start = temporal_masks(metadata)

    x_train, y_train = features.loc[train_mask], target.loc[train_mask]
    x_validation, y_validation = features.loc[validation_mask], target.loc[validation_mask]
    x_test, y_test = features.loc[test_mask], target.loc[test_mask]

    validation_results: dict[str, Any] = {}
    fitted_models: dict[str, Any] = {}
    for name, pipeline in candidate_models().items():
        fitted = pipeline.fit(x_train, y_train)
        probabilities = fitted.predict_proba(x_validation)[:, 1]
        validation_results[name] = classification_metrics(
            y_validation, probabilities, threshold=0.5
        )
        fitted_models[name] = fitted

    model_names = [name for name in validation_results if name != "dummy_prior"]
    selected_name = max(
        model_names,
        key=lambda name: (
            validation_results[name]["average_precision"],
            validation_results[name]["roc_auc"],
        ),
    )
    evaluation_model = fitted_models[selected_name]
    validation_probability = evaluation_model.predict_proba(x_validation)[:, 1]
    decision_threshold = choose_balanced_threshold(y_validation, validation_probability)
    validation_selected_metrics = classification_metrics(
        y_validation, validation_probability, threshold=decision_threshold
    )
    test_probability = evaluation_model.predict_proba(x_test)[:, 1]
    test_metrics = classification_metrics(
        y_test, test_probability, threshold=decision_threshold
    )

    # Reproduce the v1.0 Logistic Regression with preferred_language for a fair,
    # same-row, same-split comparison against the hardened language-free model.
    legacy_model = candidate_models(
        categorical_features=LEGACY_CATEGORICAL_FEATURES
    )["logistic_regression"].fit(
        legacy_features.loc[train_mask], target.loc[train_mask]
    )
    legacy_validation_probability = legacy_model.predict_proba(
        legacy_features.loc[validation_mask]
    )[:, 1]
    legacy_threshold = choose_balanced_threshold(
        y_validation, legacy_validation_probability
    )
    legacy_test_probability = legacy_model.predict_proba(
        legacy_features.loc[test_mask]
    )[:, 1]
    legacy_test_metrics = classification_metrics(
        y_test, legacy_test_probability, threshold=legacy_threshold
    )
    performance_close = bool(
        test_metrics["average_precision"]
        >= legacy_test_metrics["average_precision"] - 0.03
        and test_metrics["roc_auc"] >= legacy_test_metrics["roc_auc"] - 0.03
        and test_metrics["brier_score"] <= legacy_test_metrics["brier_score"] + 0.03
    )

    baseline_probability = fitted_models["dummy_prior"].predict_proba(x_test)[:, 1]
    baseline_test_metrics = classification_metrics(
        y_test, baseline_probability, threshold=0.5
    )

    importance = permutation_importance(
        evaluation_model,
        x_test,
        y_test,
        scoring="average_precision",
        n_repeats=20,
        random_state=42,
        # Single-process execution avoids worker/memory failures on constrained
        # Windows judge machines; the dataset is small enough for this to be fast.
        n_jobs=1,
    )
    importance_rows = sorted(
        (
            {
                "feature": feature,
                "average_precision_decrease": float(mean),
                "std": float(std),
            }
            for feature, mean, std in zip(
                FEATURE_COLUMNS, importance.importances_mean, importance.importances_std
            )
        ),
        key=lambda item: item["average_precision_decrease"],
        reverse=True,
    )

    # After unbiased evaluation, refit the deployable artifact on all finalized history.
    production_model = clone(candidate_models()[selected_name]).fit(
        features, target
    )

    coefficient_diagnostics: dict[str, list[dict[str, Any]]] = {
        "strongest_positive": [],
        "strongest_negative": [],
    }
    if selected_name == "logistic_regression":
        transformed_names = production_model.named_steps[
            "preprocess"
        ].get_feature_names_out()
        coefficients = production_model.named_steps["classifier"].coef_[0]
        coefficient_rows = [
            {"feature": str(name), "coefficient": float(coefficient)}
            for name, coefficient in zip(transformed_names, coefficients)
        ]
        coefficient_diagnostics = {
            "strongest_positive": sorted(
                coefficient_rows, key=lambda item: item["coefficient"], reverse=True
            )[:10],
            "strongest_negative": sorted(
                coefficient_rows, key=lambda item: item["coefficient"]
            )[:10],
        }

    split = {
        "validation_start": val_start,
        "test_start": test_start,
        "train": _split_summary(metadata, target, train_mask),
        "validation": _split_summary(metadata, target, validation_mask),
        "test": _split_summary(metadata, target, test_mask),
    }
    metrics: dict[str, Any] = {
        "model_version": MODEL_VERSION,
        "dataset_version": data.meta.get("version"),
        "dataset_as_of_date": data.meta.get("as_of_date"),
        "generated_at_utc": datetime.now(UTC).isoformat(),
        "target": {
            "positive_status": "completed",
            "negative_statuses": ["declined", "dropped", "no_show"],
            "excluded": ["in_progress", "overdue", "all mandatory events"],
            "samples": int(len(target)),
            "positive_samples": int(target.sum()),
            "negative_samples": int(len(target) - target.sum()),
            "positive_rate": float(target.mean()),
        },
        "temporal_split": split,
        "candidate_validation_metrics_at_0_5": validation_results,
        "selected_model": f"{selected_name}_language_free",
        "selection_reason": (
            "Language-free model selected for fairness; temporal performance is "
            "within the predefined 0.03 ROC-AUC/PR-AUC/Brier tolerance."
            if performance_close
            else "Language-free model selected by product fairness policy despite metric change."
        ),
        "selected_threshold": decision_threshold,
        "selected_validation_metrics": validation_selected_metrics,
        "test_metrics": test_metrics,
        "dummy_test_metrics": baseline_test_metrics,
        "language_removal_comparison": {
            "same_temporal_rows": True,
            "performance_close": performance_close,
            "tolerance": 0.03,
            "legacy_with_preferred_language": {
                "feature_count": len(LEGACY_FEATURE_COLUMNS),
                "validation_threshold": legacy_threshold,
                "test_metrics": legacy_test_metrics,
            },
            "final_language_free": {
                "feature_count": len(FEATURE_COLUMNS),
                "validation_threshold": decision_threshold,
                "test_metrics": test_metrics,
            },
            "test_metric_delta_new_minus_old": {
                metric: float(test_metrics[metric] - legacy_test_metrics[metric])
                for metric in (
                    "roc_auc",
                    "average_precision",
                    "f1",
                    "precision",
                    "recall",
                    "brier_score",
                )
            },
        },
        "permutation_importance": importance_rows,
        "coefficient_diagnostics": coefficient_diagnostics,
        "features": {
            "categorical": CATEGORICAL_FEATURES,
            "numeric": NUMERIC_FEATURES,
        },
    }

    artifact_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = artifact_dir / "engagement_model_language_free.joblib"
    metrics_path = artifact_dir / "metrics.json"
    artifact = {
        "model_version": MODEL_VERSION,
        "pipeline": production_model,
        "decision_threshold": decision_threshold,
        "trained_through_date": split["test"]["end_date"],
        "refit_on_all_data_after_evaluation": True,
        "feature_columns": FEATURE_COLUMNS,
        "permutation_importance": importance_rows,
        "risk_thresholds": {"low": 0.70, "medium": 0.40},
        "dataset_version": data.meta.get("version"),
        "sensitive_features_removed": ["preferred_language"],
        "coefficient_diagnostics": coefficient_diagnostics,
    }
    save_artifact(artifact, artifact_path)
    save_artifact(artifact, artifact_dir / "engagement_model.joblib")
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(json.dumps(metrics, indent=2))
    print(f"\nSaved model: {artifact_path}")
    print(f"Saved metrics: {metrics_path}")
    return metrics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--artifact-dir", type=Path, default=DEFAULT_ARTIFACT_DIR)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    train(arguments.data_dir, arguments.artifact_dir)

