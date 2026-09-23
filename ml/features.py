"""Leakage-safe feature engineering for voluntary activity engagement."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

import pandas as pd

from ml.data import OfficialData


POSITIVE_STATUS = "completed"
NEGATIVE_STATUSES = {"dropped", "no_show", "declined"}
FINAL_STATUSES = {POSITIVE_STATUS, *NEGATIVE_STATUSES}

CATEGORICAL_FEATURES = [
    "employee_role",
    "employee_grade",
    "work_format",
    "event_type",
    "event_format",
    "assigned_by",
]

LEGACY_CATEGORICAL_FEATURES = [
    "employee_role",
    "employee_grade",
    "work_format",
    "preferred_language",
    "event_type",
    "event_format",
    "assigned_by",
]

NUMERIC_FEATURES = [
    "tenure_at_event_months",
    "duration_hours",
    "developed_skill_count",
    "total_skill_gain",
    "prerequisite_count",
    "prerequisite_required_sum",
    "target_role_match",
    "target_grade_match",
    "has_prior_history",
    "prior_activity_count",
    "prior_completed_count",
    "prior_no_show_count",
    "prior_dropped_count",
    "prior_declined_count",
    "prior_completion_rate",
    "same_type_prior_count",
    "same_type_completion_rate",
    "same_format_prior_count",
    "same_format_completion_rate",
    "recent_90d_count",
    "recent_90d_completion_rate",
    "days_since_last_activity",
]

FEATURE_COLUMNS = [*CATEGORICAL_FEATURES, *NUMERIC_FEATURES]
LEGACY_FEATURE_COLUMNS = [*LEGACY_CATEGORICAL_FEATURES, *NUMERIC_FEATURES]


def _as_timestamp(value: str | date | datetime | pd.Timestamp) -> pd.Timestamp:
    return pd.Timestamp(value).normalize()


def _full_months_between(start: str | pd.Timestamp, end: pd.Timestamp) -> int:
    start_date = pd.Timestamp(start)
    months = (end.year - start_date.year) * 12 + end.month - start_date.month
    if end.day < start_date.day:
        months -= 1
    return max(0, int(months))


def training_candidates(data: OfficialData) -> pd.DataFrame:
    """Return finalized voluntary records that define the binary target."""

    frame = data.history.copy()
    frame["mandatory"] = frame["event_id"].map(
        lambda event_id: bool(data.events_by_id[event_id]["mandatory"])
    )
    return frame.loc[
        (~frame["mandatory"]) & frame["status"].isin(FINAL_STATUSES)
    ].copy()


def prior_voluntary_outcomes(
    data: OfficialData,
    employee_id: str,
    prediction_date: str | date | datetime | pd.Timestamp,
) -> pd.DataFrame:
    """Select only finalized voluntary outcomes strictly before prediction_date."""

    cutoff = _as_timestamp(prediction_date)
    employee_rows = data.history.loc[
        (data.history["employee_id"] == employee_id)
        & (data.history["date"] < cutoff)
        & (data.history["status"].isin(FINAL_STATUSES))
    ].copy()
    if employee_rows.empty:
        return employee_rows

    employee_rows["mandatory"] = employee_rows["event_id"].map(
        lambda event_id: bool(data.events_by_id[event_id]["mandatory"])
    )
    return employee_rows.loc[~employee_rows["mandatory"]].copy()


def _completion_rate(rows: pd.DataFrame, default: float = 0.5) -> float:
    if rows.empty:
        return default
    return float((rows["status"] == POSITIVE_STATUS).mean())


def _safe_employee(employee_id: str, prediction_date: pd.Timestamp) -> dict[str, Any]:
    return {
        "employee_id": employee_id,
        "role": "unknown",
        "grade": "unknown",
        "hire_date": prediction_date.strftime("%Y-%m-%d"),
        "work_format": "unknown",
        "preferred_language": "unknown",
        "skills": {},
    }


def build_prediction_features(
    data: OfficialData,
    employee_id: str,
    event_id: str,
    prediction_date: str | date | datetime | pd.Timestamp,
    *,
    assigned_by: str = "self",
    employee_override: dict[str, Any] | None = None,
    include_language: bool = False,
) -> pd.DataFrame:
    """Build a single pre-participation row using only strictly earlier history."""

    cutoff = _as_timestamp(prediction_date)
    event = data.events_by_id.get(event_id)
    if event is None:
        raise KeyError(f"Unknown event_id: {event_id}")
    if event["mandatory"]:
        raise ValueError("The engagement model only scores voluntary events")

    employee = employee_override or data.employees_by_id.get(employee_id)
    if employee is None:
        employee = _safe_employee(employee_id, cutoff)

    prior = prior_voluntary_outcomes(data, employee_id, cutoff)
    if not prior.empty:
        prior["event_type"] = prior["event_id"].map(
            lambda value: data.events_by_id[value]["type"]
        )
        prior["event_format"] = prior["event_id"].map(
            lambda value: data.events_by_id[value]["format"]
        )
    else:
        prior["event_type"] = pd.Series(dtype="object")
        prior["event_format"] = pd.Series(dtype="object")

    same_type = prior.loc[prior["event_type"] == event["type"]]
    same_format = prior.loc[prior["event_format"] == event["format"]]
    recent = prior.loc[prior["date"] >= cutoff - pd.Timedelta(days=90)]

    if prior.empty:
        days_since_last = 999.0
    else:
        days_since_last = float((cutoff - prior["date"].max()).days)

    developed_skills = event["develops_skills"]
    prerequisites = event["prerequisites"]
    row: dict[str, Any] = {
        "employee_role": employee.get("role", "unknown"),
        "employee_grade": employee.get("grade", "unknown"),
        "work_format": employee.get("work_format", "unknown"),
        "preferred_language": employee.get("preferred_language", "unknown"),
        "event_type": event["type"],
        "event_format": event["format"],
        "assigned_by": assigned_by,
        "tenure_at_event_months": _full_months_between(employee["hire_date"], cutoff),
        "duration_hours": float(event["duration_hours"]),
        "developed_skill_count": len(developed_skills),
        "total_skill_gain": float(sum(item["gain"] for item in developed_skills)),
        "prerequisite_count": len(prerequisites),
        "prerequisite_required_sum": float(sum(prerequisites.values())),
        "target_role_match": float(employee.get("role") in event["target_roles"]),
        "target_grade_match": float(employee.get("grade") in event["target_grades"]),
        "has_prior_history": float(not prior.empty),
        "prior_activity_count": len(prior),
        "prior_completed_count": int((prior["status"] == "completed").sum()),
        "prior_no_show_count": int((prior["status"] == "no_show").sum()),
        "prior_dropped_count": int((prior["status"] == "dropped").sum()),
        "prior_declined_count": int((prior["status"] == "declined").sum()),
        "prior_completion_rate": _completion_rate(prior),
        "same_type_prior_count": len(same_type),
        "same_type_completion_rate": _completion_rate(same_type),
        "same_format_prior_count": len(same_format),
        "same_format_completion_rate": _completion_rate(same_format),
        "recent_90d_count": len(recent),
        "recent_90d_completion_rate": _completion_rate(recent),
        "days_since_last_activity": days_since_last,
    }
    columns = LEGACY_FEATURE_COLUMNS if include_language else FEATURE_COLUMNS
    return pd.DataFrame([row], columns=columns)


def build_training_dataset(
    data: OfficialData,
    *,
    include_language: bool = False,
) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """Build X/y plus non-feature audit metadata in chronological order."""

    candidates = training_candidates(data).sort_values(
        ["date", "employee_id", "event_id", "record_id"], kind="stable"
    )
    feature_rows: list[pd.DataFrame] = []
    for record in candidates.itertuples(index=False):
        feature_rows.append(
            build_prediction_features(
                data,
                employee_id=record.employee_id,
                event_id=record.event_id,
                prediction_date=record.date,
                assigned_by=record.assigned_by,
                include_language=include_language,
            )
        )

    features = pd.concat(feature_rows, ignore_index=True)
    target = (candidates["status"] == POSITIVE_STATUS).astype(int).reset_index(drop=True)
    metadata = candidates[
        ["record_id", "employee_id", "event_id", "date", "status"]
    ].reset_index(drop=True)
    return features, target, metadata

