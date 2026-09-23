from typing import Any

from pydantic import BaseModel, ConfigDict


class EmployeeSummary(BaseModel):
    employee_id: str
    full_name: str
    department: str
    role: str
    grade: str
    target_role: str
    target_grade: str
    readiness_percentage: float


class EmployeeDetail(BaseModel):
    model_config = ConfigDict(extra="allow")

    employee_id: str
    full_name: str
    department: str
    role: str
    grade: str
    manager_id: str | None
    hire_date: str
    tenure_months: int
    work_format: str
    preferred_language: str
    career_goal: dict[str, str] | None
    skills: dict[str, int]
    last_review_date: str
    career_path: list[str]
    runtime_completed_event_ids: list[str]


class RecommendationResponse(BaseModel):
    employee_id: str
    recommendations: list[dict[str, Any]]
    career_score_formula: str
    ml_multiplier_formula: str
