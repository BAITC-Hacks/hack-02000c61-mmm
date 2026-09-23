from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from ml.data import employee_skill_level, load_official_data
from ml.features import (
    FEATURE_COLUMNS,
    FINAL_STATUSES,
    build_prediction_features,
    build_training_dataset,
    prior_voluntary_outcomes,
    training_candidates,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "case_1" / "career_quest_dataset"


@pytest.fixture(scope="session")
def official_data():
    return load_official_data(DATA_DIR)


def test_training_target_contains_only_finalized_voluntary_records(official_data):
    candidates = training_candidates(official_data)

    assert set(candidates["status"]).issubset(FINAL_STATUSES)
    assert not candidates["mandatory"].any()
    assert "overdue" not in set(candidates["status"])
    assert "in_progress" not in set(candidates["status"])


def test_historical_features_never_use_current_or_future_records(official_data):
    candidate = training_candidates(official_data).iloc[len(training_candidates(official_data)) // 2]
    prior = prior_voluntary_outcomes(
        official_data, candidate["employee_id"], candidate["date"]
    )

    assert prior.empty or (prior["date"] < candidate["date"]).all()
    features = build_prediction_features(
        official_data,
        candidate["employee_id"],
        candidate["event_id"],
        candidate["date"],
        assigned_by=candidate["assigned_by"],
    )
    assert int(features.iloc[0]["prior_activity_count"]) == len(prior)


def test_forbidden_outcome_fields_are_not_model_features(official_data):
    forbidden = {
        "status",
        "completion_pct",
        "score",
        "feedback_rating",
        "due_date",
        "record_id",
        "preferred_language",
        "employee_id",
        "event_id",
    }
    features, _, _ = build_training_dataset(official_data)

    assert forbidden.isdisjoint(features.columns)
    assert list(features.columns) == FEATURE_COLUMNS


def test_future_history_does_not_change_earlier_features(official_data):
    candidate = training_candidates(official_data).iloc[len(training_candidates(official_data)) // 3]
    baseline = build_prediction_features(
        official_data,
        candidate["employee_id"],
        candidate["event_id"],
        candidate["date"],
        assigned_by=candidate["assigned_by"],
    )
    future_row = official_data.history.iloc[0].copy()
    future_row["record_id"] = "R_FUTURE_TEST"
    future_row["employee_id"] = candidate["employee_id"]
    future_row["event_id"] = candidate["event_id"]
    future_row["date"] = candidate["date"] + pd.Timedelta(days=1)
    future_row["status"] = "no_show"
    from dataclasses import replace

    augmented = replace(
        official_data,
        history=pd.concat(
            [official_data.history, pd.DataFrame([future_row])], ignore_index=True
        ),
    )
    with_future = build_prediction_features(
        augmented,
        candidate["employee_id"],
        candidate["event_id"],
        candidate["date"],
        assigned_by=candidate["assigned_by"],
    )

    pd.testing.assert_frame_equal(baseline, with_future)


def test_missing_skill_is_level_zero():
    assert employee_skill_level({"skills": {"SK_PYTHON": 3}}, "SK_UNKNOWN") == 0


def test_additional_profile_without_history_is_supported(official_data):
    source = next(iter(official_data.employees_by_id.values()))
    new_employee = {
        **source,
        "employee_id": "E9999",
        "skills": {},
        "hire_date": "2026-09-15",
    }
    voluntary_event = next(
        event for event in official_data.events_by_id.values() if not event["mandatory"]
    )

    features = build_prediction_features(
        official_data,
        new_employee["employee_id"],
        voluntary_event["event_id"],
        "2026-10-01",
        employee_override=new_employee,
    )

    assert features.shape == (1, len(FEATURE_COLUMNS))
    assert features.iloc[0]["prior_activity_count"] == 0
    assert features.iloc[0]["has_prior_history"] == 0


def test_unknown_employee_uses_safe_defaults(official_data):
    voluntary_event = next(
        event for event in official_data.events_by_id.values() if not event["mandatory"]
    )
    features = build_prediction_features(
        official_data,
        "UNKNOWN_EMPLOYEE",
        voluntary_event["event_id"],
        pd.Timestamp("2026-10-01"),
    )

    assert features.iloc[0]["employee_role"] == "unknown"
    assert features.iloc[0]["tenure_at_event_months"] == 0
    assert features.iloc[0]["prior_completion_rate"] == 0.5


def test_mandatory_event_is_rejected(official_data):
    mandatory_event = next(
        event for event in official_data.events_by_id.values() if event["mandatory"]
    )
    with pytest.raises(ValueError, match="voluntary"):
        build_prediction_features(
            official_data,
            next(iter(official_data.employees_by_id)),
            mandatory_event["event_id"],
            "2026-10-01",
        )

