"""CLI and Python interface for voluntary activity completion probability."""

from __future__ import annotations

import argparse
import json
import math
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ml.data import OfficialData, load_official_data
from ml.features import build_prediction_features
from ml.model import load_artifact
from ml.train import DEFAULT_ARTIFACT_DIR, DEFAULT_DATA_DIR


@lru_cache(maxsize=4)
def _cached_data(data_dir: str) -> OfficialData:
    return load_official_data(data_dir)


@lru_cache(maxsize=4)
def _cached_artifact(artifact_path: str) -> dict[str, Any]:
    return load_artifact(artifact_path)


def _json_value(value: Any) -> Any:
    if isinstance(value, (np.integer, np.floating)):
        return value.item()
    if pd.isna(value):
        return None
    return value


def _risk_level(probability: float, thresholds: dict[str, float]) -> str:
    if probability >= thresholds["low"]:
        return "low"
    if probability >= thresholds["medium"]:
        return "medium"
    return "high"


def predict_engagement(
    employee_id: str,
    event_id: str,
    prediction_date: str | date | datetime | None = None,
    *,
    data_dir: str | Path = DEFAULT_DATA_DIR,
    artifact_path: str | Path = DEFAULT_ARTIFACT_DIR
    / "engagement_model_language_free.joblib",
    assigned_by: str = "self",
    employee_override: dict[str, Any] | None = None,
    data_override: OfficialData | None = None,
) -> dict[str, Any]:
    data = data_override or _cached_data(str(Path(data_dir).resolve()))
    artifact = _cached_artifact(str(Path(artifact_path).resolve()))
    effective_date = prediction_date or data.meta["as_of_date"]
    row = build_prediction_features(
        data,
        employee_id,
        event_id,
        effective_date,
        assigned_by=assigned_by,
        employee_override=employee_override,
    )
    probability = float(artifact["pipeline"].predict_proba(row)[:, 1][0])
    if not math.isfinite(probability) or not 0.0 <= probability <= 1.0:
        raise ValueError("Model returned an invalid completion probability")

    top_signals = []
    for item in artifact.get("permutation_importance", [])[:5]:
        feature = item["feature"]
        top_signals.append(
            {
                "feature": feature,
                "value": _json_value(row.iloc[0][feature]),
                "global_average_precision_decrease": item[
                    "average_precision_decrease"
                ],
            }
        )

    return {
        "employee_id": employee_id,
        "event_id": event_id,
        "prediction_date": str(pd.Timestamp(effective_date).date()),
        "completion_probability": round(probability, 6),
        "risk_level": _risk_level(probability, artifact["risk_thresholds"]),
        "model_version": artifact["model_version"],
        "top_signals": top_signals,
        "signal_note": (
            "Signals show current input values for globally important features; "
            "they are not local causal or directional explanations."
        ),
    }


def predict_engagement_safe(
    employee_id: str,
    event_id: str,
    prediction_date: str | date | datetime | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    """Never raise into the career engine; unavailable ML has no invented score."""

    try:
        result = predict_engagement(
            employee_id,
            event_id,
            prediction_date,
            **kwargs,
        )
        probability = result.get("completion_probability")
        if (
            probability is None
            or not math.isfinite(float(probability))
            or not 0.0 <= float(probability) <= 1.0
        ):
            raise ValueError("Invalid probability in prediction result")
        return {
            "available": True,
            "completion_probability": float(probability),
            "risk_level": result["risk_level"],
            "source": "ml",
            "model_version": result["model_version"],
            "top_signals": result.get("top_signals", []),
            "signal_note": result.get("signal_note"),
        }
    except Exception:
        return {
            "available": False,
            "completion_probability": None,
            "risk_level": None,
            "source": "deterministic_fallback",
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--employee", required=True)
    parser.add_argument("--event", required=True)
    parser.add_argument("--date", default=None)
    parser.add_argument("--assigned-by", choices=["self", "manager", "hr"], default="self")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument(
        "--artifact",
        type=Path,
        default=DEFAULT_ARTIFACT_DIR / "engagement_model_language_free.joblib",
    )
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    result = predict_engagement(
        arguments.employee,
        arguments.event,
        arguments.date,
        data_dir=arguments.data_dir,
        artifact_path=arguments.artifact,
        assigned_by=arguments.assigned_by,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))

