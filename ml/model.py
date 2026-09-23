"""Model candidates, temporal evaluation metrics, and artifact helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_curve,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml.features import CATEGORICAL_FEATURES, NUMERIC_FEATURES


def _preprocessor(
    *,
    scale_numeric: bool,
    categorical_features: list[str],
) -> ColumnTransformer:
    numeric_steps: list[tuple[str, Any]] = [
        ("impute", SimpleImputer(strategy="median")),
    ]
    if scale_numeric:
        numeric_steps.append(("scale", StandardScaler()))

    return ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    [
                        ("impute", SimpleImputer(strategy="most_frequent")),
                        (
                            "one_hot",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        ),
                    ]
                ),
                categorical_features,
            ),
            ("numeric", Pipeline(numeric_steps), NUMERIC_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def candidate_models(
    *, categorical_features: list[str] | None = None
) -> dict[str, Pipeline]:
    categories = categorical_features or CATEGORICAL_FEATURES
    return {
        "dummy_prior": Pipeline(
            [
                (
                    "preprocess",
                    _preprocessor(scale_numeric=False, categorical_features=categories),
                ),
                ("classifier", DummyClassifier(strategy="prior")),
            ]
        ),
        "logistic_regression": Pipeline(
            [
                (
                    "preprocess",
                    _preprocessor(scale_numeric=True, categorical_features=categories),
                ),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2_000,
                        random_state=42,
                    ),
                ),
            ]
        ),
        "hist_gradient_boosting": Pipeline(
            [
                (
                    "preprocess",
                    _preprocessor(scale_numeric=False, categorical_features=categories),
                ),
                (
                    "classifier",
                    HistGradientBoostingClassifier(
                        learning_rate=0.05,
                        max_iter=250,
                        max_leaf_nodes=15,
                        min_samples_leaf=20,
                        l2_regularization=1.0,
                        random_state=42,
                    ),
                ),
            ]
        ),
    }


def choose_balanced_threshold(y_true: pd.Series, probability: np.ndarray) -> float:
    """Choose the validation threshold with the best sensitivity/specificity tradeoff."""

    false_positive_rate, true_positive_rate, thresholds = roc_curve(y_true, probability)
    finite = np.isfinite(thresholds)
    if not finite.any():
        return 0.5
    youden_j = true_positive_rate[finite] - false_positive_rate[finite]
    return float(thresholds[finite][int(np.argmax(youden_j))])


def classification_metrics(
    y_true: pd.Series,
    probability: np.ndarray,
    *,
    threshold: float,
) -> dict[str, Any]:
    prediction = (probability >= threshold).astype(int)
    matrix = confusion_matrix(y_true, prediction, labels=[0, 1])
    return {
        "roc_auc": float(roc_auc_score(y_true, probability)),
        "average_precision": float(average_precision_score(y_true, probability)),
        "f1": float(f1_score(y_true, prediction, zero_division=0)),
        "precision": float(precision_score(y_true, prediction, zero_division=0)),
        "recall": float(recall_score(y_true, prediction, zero_division=0)),
        "brier_score": float(brier_score_loss(y_true, probability)),
        "threshold": float(threshold),
        "confusion_matrix": {
            "true_negative": int(matrix[0, 0]),
            "false_positive": int(matrix[0, 1]),
            "false_negative": int(matrix[1, 0]),
            "true_positive": int(matrix[1, 1]),
        },
    }


def save_artifact(artifact: dict[str, Any], path: str | Path) -> None:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, destination)


def load_artifact(path: str | Path) -> dict[str, Any]:
    value = joblib.load(Path(path))
    if not isinstance(value, dict) or "pipeline" not in value:
        raise ValueError("Unsupported engagement model artifact")
    return value

