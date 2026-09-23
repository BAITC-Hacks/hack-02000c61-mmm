"""Failure-safe adapter around the trained ML prediction interface."""

from __future__ import annotations

import sys
from typing import Any

from app.services.data_loader import DEFAULT_DATA_DIRECTORY, PROJECT_ROOT


class EngagementModelAdapter:
    """Use the saved language-free model through its safe prediction interface."""

    def __init__(self) -> None:
        self._probabilities: dict[tuple[str, str], float] = {}

    def __call__(self, employee: dict[str, Any], event: dict[str, Any]) -> float | None:
        key = (employee["employee_id"], event["event_id"])
        if key in self._probabilities:
            return self._probabilities[key]
        if str(PROJECT_ROOT) not in sys.path:
            sys.path.insert(0, str(PROJECT_ROOT))
        from ml.predict import predict_engagement_safe

        result = predict_engagement_safe(
            employee["employee_id"],
            event["event_id"],
            data_dir=DEFAULT_DATA_DIRECTORY,
            employee_override=employee,
        )
        if not result["available"]:
            return None
        probability = float(result["completion_probability"])
        self._probabilities[key] = probability
        return probability
