from __future__ import annotations

import json
import shutil

import pytest

from app.progress.service import calculate_readiness
from app.recommendation.engine import CareerRecommendationEngine, simulate_activity
from app.services.career_service import CareerQuestService
from app.services.data_loader import (
    DEFAULT_DATA_DIRECTORY,
    OfficialDataLoader,
    OfficialDataset,
    load_default_dataset,
)


@pytest.fixture(scope="module")
def dataset() -> OfficialDataset:
    return load_default_dataset()


def _synthetic_employee(employee_id: str = "E9999") -> dict:
    return {
        "employee_id": employee_id,
        "full_name": "Synthetic Judge Profile",
        "department": "Backend Development",
        "role": "Backend Engineer",
        "grade": "Middle",
        "manager_id": None,
        "hire_date": "2025-01-01",
        "tenure_months": 21,
        "work_format": "remote",
        "preferred_language": "en",
        "career_goal": {"target_role": "Backend Engineer", "target_grade": "Senior"},
        "skills": {"SK_SYSTEM_DESIGN": 2, "SK_API_DESIGN": 3, "SK_PYTHON": 3},
        "last_review_date": "2026-09-01",
    }


def test_additional_official_schema_employee_loads(tmp_path):
    data_dir = tmp_path / "dataset"
    shutil.copytree(DEFAULT_DATA_DIRECTORY, data_dir)
    path = data_dir / "employees.json"
    root = json.loads(path.read_text(encoding="utf-8"))
    root["employees"].append(_synthetic_employee())
    path.write_text(json.dumps(root), encoding="utf-8")

    loaded = OfficialDataLoader(data_dir).load()
    assert loaded.employees_by_id["E9999"]["career_goal"]["target_grade"] == "Senior"


def test_employee_without_history_gets_deterministic_recommendations(dataset):
    employee = _synthetic_employee()
    recommendations = CareerRecommendationEngine(dataset).rank(employee, history=[])
    assert recommendations
    assert all(item["engagement_probability"] is None for item in recommendations)


def test_ml_failure_falls_back_to_career_score(dataset):
    def broken_predictor(employee, event):
        raise RuntimeError("model unavailable")

    recommendation = CareerRecommendationEngine(dataset, broken_predictor).rank(
        _synthetic_employee(), history=[]
    )[0]
    assert recommendation["ml_status"] == "fallback"
    assert recommendation["final_score"] == recommendation["career_score"]


def test_missing_skill_uses_official_zero_rule(dataset):
    employee = _synthetic_employee()
    employee["skills"] = {}
    career = calculate_readiness(dataset, employee)
    system_design = next(item for item in career["requirements"] if item["skill_id"] == "SK_SYSTEM_DESIGN")
    assert system_design["current_level"] == 0
    assert system_design["gap"] == system_design["required_level"]


def test_mandatory_activity_is_never_eligible(dataset):
    engine = CareerRecommendationEngine(dataset)
    result = engine.eligibility(_synthetic_employee(), dataset.events_by_id["EV_001"])
    assert result["eligible"] is False
    assert any("mandatory" in reason for reason in result["reasons"])


def test_unsatisfied_prerequisite_blocks_activity(dataset):
    employee = _synthetic_employee()
    employee["skills"]["SK_SYSTEM_DESIGN"] = 1
    result = CareerRecommendationEngine(dataset).eligibility(employee, dataset.events_by_id["EV_006"])
    assert result["eligible"] is False
    assert result["prerequisites_satisfied"] is False


def test_gain_and_max_level_simulation(dataset):
    employee = _synthetic_employee()
    employee["skills"].update({"SK_SYSTEM_DESIGN": 4, "SK_API_DESIGN": 4, "SK_OBSERVABILITY": 4})
    result = simulate_activity(dataset, employee, dataset.events_by_id["EV_006"])
    changes = {item["skill_id"]: item for item in result["skill_changes"]}
    assert changes["SK_SYSTEM_DESIGN"]["after"] == 5
    assert changes["SK_API_DESIGN"]["after"] == 4
    assert changes["SK_API_DESIGN"]["gain_applied"] == 0


def test_completing_activity_changes_readiness(dataset):
    service = CareerQuestService(dataset, enable_default_ml=False)
    before = service.career("E0001")["readiness_percentage"]
    event_id = service.recommendations("E0001", use_ml=False)[0]["event_id"]
    response = service.complete("E0001", event_id)
    assert response["career"]["readiness_percentage"] > before


def test_recommendations_recalculate_after_completion(dataset):
    service = CareerQuestService(dataset, enable_default_ml=False)
    before = service.recommendations("E0001", use_ml=False)
    completed_id = before[0]["event_id"]
    response = service.complete("E0001", completed_id)
    after_ids = [item["event_id"] for item in response["recommendations"]]
    assert completed_id not in after_ids
    assert after_ids != [item["event_id"] for item in before]


def test_critical_gap_can_outrank_larger_noncritical_gap():
    skills = {
        "CRIT": {"skill_id": "CRIT", "name": "Critical Design", "type": "hard", "category": "Engineering", "description": ""},
        "OTHER": {"skill_id": "OTHER", "name": "Other Skill", "type": "hard", "category": "Engineering", "description": ""},
    }
    employee = {
        **_synthetic_employee("TRICKY"),
        "role": "Test Role",
        "grade": "Junior",
        "career_goal": {"target_role": "Test Role", "target_grade": "Middle"},
        "skills": {"CRIT": 2, "OTHER": 0},
    }
    events = (
        {
            "event_id": "CRITICAL_EVENT", "title": "Critical Lab", "description": "", "type": "course",
            "format": "self_paced", "duration_hours": 1, "mandatory": False,
            "target_roles": ["Test Role"], "target_grades": ["Middle"],
            "develops_skills": [{"skill_id": "CRIT", "gain": 1, "max_level": 5}],
            "prerequisites": {}, "upcoming_sessions": [],
        },
        {
            "event_id": "OTHER_EVENT", "title": "Other Lab", "description": "", "type": "course",
            "format": "self_paced", "duration_hours": 1, "mandatory": False,
            "target_roles": ["Test Role"], "target_grades": ["Middle"],
            "develops_skills": [{"skill_id": "OTHER", "gain": 1, "max_level": 5}],
            "prerequisites": {}, "upcoming_sessions": [],
        },
    )
    profile = {
        "role": "Test Role", "grade": "Middle",
        "required_skills": {"CRIT": 4, "OTHER": 4}, "critical_skills": ["CRIT"],
    }
    dataset = OfficialDataset(
        meta={"as_of_date": "2026-10-01"}, proficiency_scale={},
        employees=(employee,), employees_by_id={"TRICKY": employee},
        events=events, events_by_id={item["event_id"]: item for item in events},
        skills_by_id=skills, role_profiles=(profile,),
        role_profiles_by_key={("Test Role", "Middle"): profile}, history=(),
    )
    ranked = CareerRecommendationEngine(dataset).rank(employee, history=[])
    assert ranked[0]["event_id"] == "CRITICAL_EVENT"
    assert ranked[0]["score_components"]["critical_skill_relevance"] > 0
