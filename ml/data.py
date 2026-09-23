"""Strict read-only loading of the official Career Quest dataset."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd


EMPLOYEE_FIELDS = {
    "employee_id",
    "full_name",
    "department",
    "role",
    "grade",
    "manager_id",
    "hire_date",
    "tenure_months",
    "work_format",
    "preferred_language",
    "career_goal",
    "skills",
    "last_review_date",
}
EVENT_FIELDS = {
    "event_id",
    "title",
    "description",
    "type",
    "format",
    "duration_hours",
    "mandatory",
    "target_roles",
    "target_grades",
    "develops_skills",
    "prerequisites",
    "upcoming_sessions",
}
HISTORY_FIELDS = {
    "record_id",
    "employee_id",
    "event_id",
    "date",
    "due_date",
    "status",
    "completion_pct",
    "score",
    "feedback_rating",
    "assigned_by",
}


@dataclass(frozen=True)
class OfficialData:
    meta: dict[str, Any]
    employees_by_id: dict[str, dict[str, Any]]
    events_by_id: dict[str, dict[str, Any]]
    skills_by_id: dict[str, dict[str, Any]]
    role_profiles: list[dict[str, Any]]
    history: pd.DataFrame


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        value = json.load(source)
    if not isinstance(value, dict):
        raise ValueError(f"{path.name} must have an object root")
    return value


def _require_fields(record: dict[str, Any], expected: set[str], source: str) -> None:
    missing = expected.difference(record)
    if missing:
        raise ValueError(f"{source} is missing required fields: {sorted(missing)}")


def load_official_data(data_dir: str | Path) -> OfficialData:
    """Load and validate official files without modifying them."""

    base = Path(data_dir)
    employees_root = _read_json(base / "employees.json")
    events_root = _read_json(base / "events.json")
    skills_root = _read_json(base / "skills.json")
    history = pd.read_csv(base / "activity_history.csv", encoding="utf-8-sig")

    employees = employees_root.get("employees")
    events = events_root.get("events")
    skills = skills_root.get("skills")
    role_profiles = skills_root.get("role_profiles")
    if not all(isinstance(value, list) for value in (employees, events, skills, role_profiles)):
        raise ValueError("Official JSON collection keys must contain arrays")
    if set(history.columns) != HISTORY_FIELDS:
        raise ValueError(
            f"activity_history.csv columns differ from the official schema: {list(history.columns)}"
        )

    for index, employee in enumerate(employees):
        _require_fields(employee, EMPLOYEE_FIELDS, f"employees[{index}]")
    for index, event in enumerate(events):
        _require_fields(event, EVENT_FIELDS, f"events[{index}]")

    employees_by_id = {record["employee_id"]: record for record in employees}
    events_by_id = {record["event_id"]: record for record in events}
    skills_by_id = {record["skill_id"]: record for record in skills}
    if len(employees_by_id) != len(employees):
        raise ValueError("employee_id values must be unique")
    if len(events_by_id) != len(events):
        raise ValueError("event_id values must be unique")
    if len(skills_by_id) != len(skills):
        raise ValueError("skill_id values must be unique")

    unknown_employees = set(history["employee_id"]).difference(employees_by_id)
    unknown_events = set(history["event_id"]).difference(events_by_id)
    if unknown_employees or unknown_events:
        raise ValueError(
            f"History contains unknown references: employees={sorted(unknown_employees)}, "
            f"events={sorted(unknown_events)}"
        )

    history = history.copy()
    history["date"] = pd.to_datetime(history["date"], format="%Y-%m-%d")
    history["due_date"] = pd.to_datetime(history["due_date"], format="%Y-%m-%d", errors="coerce")
    history = history.sort_values(
        ["date", "employee_id", "event_id", "record_id"], kind="stable"
    ).reset_index(drop=True)

    versions = {
        root.get("meta", {}).get("version")
        for root in (employees_root, events_root, skills_root)
    }
    if len(versions) != 1:
        raise ValueError(f"Dataset component versions disagree: {sorted(versions)}")

    return OfficialData(
        meta=employees_root.get("meta", {}),
        employees_by_id=employees_by_id,
        events_by_id=events_by_id,
        skills_by_id=skills_by_id,
        role_profiles=role_profiles,
        history=history,
    )


def employee_skill_level(employee: dict[str, Any], skill_id: str) -> int:
    """Apply the official rule: a missing employee skill has level zero."""

    return int(employee.get("skills", {}).get(skill_id, 0))

