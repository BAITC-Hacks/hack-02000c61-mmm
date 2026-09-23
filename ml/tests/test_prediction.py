from __future__ import annotations

from dataclasses import replace
from itertools import product
from pathlib import Path

import pandas as pd
import pytest

import ml.predict as prediction_module
from ml.data import load_official_data
from ml.features import FEATURE_COLUMNS, build_training_dataset
from ml.integration import engagement_multiplier
from ml.model import load_artifact
from ml.predict import predict_engagement, predict_engagement_safe


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "case_1" / "career_quest_dataset"
ARTIFACT = REPO_ROOT / "ml" / "artifacts" / "engagement_model_language_free.joblib"


@pytest.fixture(scope="module")
def official_data():
    return load_official_data(DATA_DIR)


def test_unknown_employee_receives_a_finite_prediction():
    result = predict_engagement(
        "UNKNOWN_EMPLOYEE",
        "EV_006",
        "2026-10-01",
        data_dir=DATA_DIR,
        artifact_path=ARTIFACT,
    )

    assert 0.0 <= result["completion_probability"] <= 1.0
    assert result["risk_level"] in {"low", "medium", "high"}
    assert result["model_version"]


def test_final_artifact_has_no_language_or_identity_features():
    artifact = load_artifact(ARTIFACT)
    transformed_names = artifact["pipeline"].named_steps[
        "preprocess"
    ].get_feature_names_out()

    assert "preferred_language" not in artifact["feature_columns"]
    assert not any("preferred_language" in name for name in transformed_names)
    assert "employee_id" not in artifact["feature_columns"]
    assert "event_id" not in artifact["feature_columns"]
    assert set(artifact["feature_columns"]) == set(FEATURE_COLUMNS)


def test_known_employee_with_history(official_data):
    employee_counts = official_data.history["employee_id"].value_counts()
    employee_id = str(employee_counts.index[0])
    event_id = next(
        event["event_id"]
        for event in official_data.events_by_id.values()
        if not event["mandatory"]
    )

    result = predict_engagement_safe(
        employee_id,
        event_id,
        "2026-10-01",
        data_override=official_data,
        artifact_path=ARTIFACT,
    )

    assert result["available"] is True
    assert result["source"] == "ml"


def test_new_employee_with_valid_profile_and_history(official_data):
    source_employee = next(iter(official_data.employees_by_id.values()))
    new_employee = {**source_employee, "employee_id": "E_NEW_WITH_HISTORY"}
    voluntary_events = [
        event
        for event in official_data.events_by_id.values()
        if not event["mandatory"]
    ]
    history_row = official_data.history.iloc[0].copy()
    history_row.update(
        {
            "record_id": "R_NEW_EMPLOYEE_HISTORY",
            "employee_id": new_employee["employee_id"],
            "event_id": voluntary_events[0]["event_id"],
            "date": pd.Timestamp("2026-01-15"),
            "due_date": pd.NaT,
            "status": "completed",
            "completion_pct": 100,
            "score": 80,
            "feedback_rating": 4,
            "assigned_by": "self",
        }
    )
    augmented = replace(
        official_data,
        employees_by_id={
            **official_data.employees_by_id,
            new_employee["employee_id"]: new_employee,
        },
        history=pd.concat(
            [official_data.history, pd.DataFrame([history_row])], ignore_index=True
        ),
    )

    result = predict_engagement_safe(
        new_employee["employee_id"],
        voluntary_events[1]["event_id"],
        "2026-10-01",
        data_override=augmented,
        artifact_path=ARTIFACT,
    )

    assert result["available"] is True
    assert 0.0 <= result["completion_probability"] <= 1.0


def test_new_employee_zero_history_missing_optional_fields_and_skills(official_data):
    source_employee = next(iter(official_data.employees_by_id.values()))
    new_employee = {
        **source_employee,
        "employee_id": "E_NEW_COLD_START",
        "manager_id": None,
        "career_goal": None,
        "skills": {},
    }
    event_id = next(
        event["event_id"]
        for event in official_data.events_by_id.values()
        if not event["mandatory"]
    )

    result = predict_engagement_safe(
        new_employee["employee_id"],
        event_id,
        "2026-10-01",
        employee_override=new_employee,
        data_override=official_data,
        artifact_path=ARTIFACT,
    )

    assert result["available"] is True
    assert 0.0 <= result["completion_probability"] <= 1.0


def test_unseen_but_valid_categorical_combination_is_supported(official_data):
    features, _, _ = build_training_dataset(official_data)
    observed = set(
        features[
            ["employee_role", "employee_grade", "work_format", "event_type", "event_format"]
        ].itertuples(index=False, name=None)
    )
    roles = sorted({employee["role"] for employee in official_data.employees_by_id.values()})
    grades = sorted({employee["grade"] for employee in official_data.employees_by_id.values()})
    work_formats = sorted(
        {employee["work_format"] for employee in official_data.employees_by_id.values()}
    )
    voluntary_events = [
        event for event in official_data.events_by_id.values() if not event["mandatory"]
    ]
    event_pairs = sorted({(event["type"], event["format"]) for event in voluntary_events})
    unseen = next(
        combination
        for combination in product(roles, grades, work_formats, event_pairs)
        if (
            combination[0],
            combination[1],
            combination[2],
            combination[3][0],
            combination[3][1],
        )
        not in observed
    )
    role, grade, work_format, event_pair = unseen
    event = next(
        item
        for item in voluntary_events
        if (item["type"], item["format"]) == event_pair
    )
    source_employee = next(iter(official_data.employees_by_id.values()))
    profile = {
        **source_employee,
        "employee_id": "E_UNSEEN_COMBINATION",
        "role": role,
        "grade": grade,
        "work_format": work_format,
        "skills": {},
    }

    result = predict_engagement_safe(
        profile["employee_id"],
        event["event_id"],
        "2026-10-01",
        employee_override=profile,
        data_override=official_data,
        artifact_path=ARTIFACT,
    )
    encoder = load_artifact(ARTIFACT)["pipeline"].named_steps["preprocess"].named_transformers_[
        "categorical"
    ].named_steps["one_hot"]

    assert result["available"] is True
    assert encoder.handle_unknown == "ignore"


def test_missing_artifact_returns_safe_fallback(official_data):
    result = predict_engagement_safe(
        "E0002",
        "EV_006",
        "2026-10-01",
        data_override=official_data,
        artifact_path=ARTIFACT.parent / "intentionally_missing_test_artifact.joblib",
    )

    assert result == {
        "available": False,
        "completion_probability": None,
        "risk_level": None,
        "source": "deterministic_fallback",
    }


def test_invalid_probability_returns_safe_fallback(monkeypatch):
    monkeypatch.setattr(
        prediction_module,
        "predict_engagement",
        lambda *args, **kwargs: {
            "completion_probability": float("nan"),
            "risk_level": "low",
            "model_version": "broken",
        },
    )

    result = prediction_module.predict_engagement_safe("E0002", "EV_006")

    assert result["available"] is False
    assert result["completion_probability"] is None
    assert result["source"] == "deterministic_fallback"


@pytest.mark.parametrize(
    ("probability", "expected"),
    [(0.0, 0.9), (0.5, 1.0), (1.0, 1.1)],
)
def test_engagement_multiplier_bounds(probability, expected):
    assert engagement_multiplier(probability) == pytest.approx(expected)


def test_engagement_multiplier_is_neutral_when_unavailable():
    assert engagement_multiplier(None, available=False) == 1.0


@pytest.mark.parametrize("employee_index", [0, 1, 2, 3, 4])
def test_identity_free_generalization_for_simulated_unseen_employees(
    employee_index, official_data
):
    employee = list(official_data.employees_by_id.values())[employee_index]
    simulated = {
        **employee,
        "employee_id": f"E_SIMULATED_{employee_index}",
    }
    event_id = next(
        event["event_id"]
        for event in official_data.events_by_id.values()
        if not event["mandatory"]
    )

    result = predict_engagement_safe(
        simulated["employee_id"],
        event_id,
        "2026-10-01",
        employee_override=simulated,
        data_override=official_data,
        artifact_path=ARTIFACT,
    )

    assert result["available"] is True

