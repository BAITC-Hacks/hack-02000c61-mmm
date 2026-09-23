"""Validated, read-only loading of the official Career Quest dataset."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


GRADE_ORDER = ("Junior", "Middle", "Senior", "Lead")
REPEATABLE_EVENT_IDS = frozenset({"EV_036"})
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATA_DIRECTORY = PROJECT_ROOT / "data" / "case_1" / "career_quest_dataset"

EMPLOYEE_FIELDS = {
    "employee_id", "full_name", "department", "role", "grade", "manager_id",
    "hire_date", "tenure_months", "work_format", "preferred_language",
    "career_goal", "skills", "last_review_date",
}
EVENT_FIELDS = {
    "event_id", "title", "description", "type", "format", "duration_hours",
    "mandatory", "target_roles", "target_grades", "develops_skills",
    "prerequisites", "upcoming_sessions",
}
HISTORY_FIELDS = {
    "record_id", "employee_id", "event_id", "date", "due_date", "status",
    "completion_pct", "score", "feedback_rating", "assigned_by",
}


@dataclass(frozen=True)
class OfficialDataset:
    meta: dict[str, Any]
    proficiency_scale: dict[str, str]
    employees: tuple[dict[str, Any], ...]
    employees_by_id: dict[str, dict[str, Any]]
    events: tuple[dict[str, Any], ...]
    events_by_id: dict[str, dict[str, Any]]
    skills_by_id: dict[str, dict[str, Any]]
    role_profiles: tuple[dict[str, Any], ...]
    role_profiles_by_key: dict[tuple[str, str], dict[str, Any]]
    history: tuple[dict[str, Any], ...]


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8-sig") as source:
        value = json.load(source)
    if not isinstance(value, dict):
        raise ValueError(f"{path.name} must contain an object at its root")
    return value


def _require(record: dict[str, Any], fields: set[str], location: str) -> None:
    missing = fields.difference(record)
    if missing:
        raise ValueError(f"{location} is missing official fields: {sorted(missing)}")


class OfficialDataLoader:
    """Load official-format files without ever writing to them.

    Extra records are supported automatically when they use the same schema. Extra
    fields are retained, allowing forward-compatible evaluation profiles.
    """

    def __init__(self, data_directory: Path = DEFAULT_DATA_DIRECTORY) -> None:
        self.data_directory = Path(data_directory)

    def load(self) -> OfficialDataset:
        employee_root = _read_json(self.data_directory / "employees.json")
        event_root = _read_json(self.data_directory / "events.json")
        skill_root = _read_json(self.data_directory / "skills.json")

        employees = employee_root.get("employees")
        events = event_root.get("events")
        skills = skill_root.get("skills")
        profiles = skill_root.get("role_profiles")
        if not all(isinstance(value, list) for value in (employees, events, skills, profiles)):
            raise ValueError("Official JSON collection keys must contain arrays")

        for index, employee in enumerate(employees):
            _require(employee, EMPLOYEE_FIELDS, f"employees[{index}]")
            if employee["grade"] not in GRADE_ORDER:
                raise ValueError(f"employees[{index}] has unknown grade {employee['grade']!r}")
        for index, event in enumerate(events):
            _require(event, EVENT_FIELDS, f"events[{index}]")

        with (self.data_directory / "activity_history.csv").open(
            encoding="utf-8-sig", newline=""
        ) as source:
            reader = csv.DictReader(source)
            if set(reader.fieldnames or ()) != HISTORY_FIELDS:
                raise ValueError("activity_history.csv columns differ from the official schema")
            history = list(reader)

        employees_by_id = {item["employee_id"]: item for item in employees}
        events_by_id = {item["event_id"]: item for item in events}
        skills_by_id = {item["skill_id"]: item for item in skills}
        profiles_by_key = {(item["role"], item["grade"]): item for item in profiles}
        if len(employees_by_id) != len(employees):
            raise ValueError("employee_id values must be unique")
        if len(events_by_id) != len(events):
            raise ValueError("event_id values must be unique")
        if len(skills_by_id) != len(skills):
            raise ValueError("skill_id values must be unique")
        if len(profiles_by_key) != len(profiles):
            raise ValueError("role/grade profile pairs must be unique")

        unknown_employees = {row["employee_id"] for row in history} - employees_by_id.keys()
        unknown_events = {row["event_id"] for row in history} - events_by_id.keys()
        if unknown_employees or unknown_events:
            raise ValueError(
                f"History contains unknown references: employees={sorted(unknown_employees)}, "
                f"events={sorted(unknown_events)}"
            )

        versions = {
            root.get("meta", {}).get("version")
            for root in (employee_root, event_root, skill_root)
        }
        if len(versions) != 1:
            raise ValueError("Dataset component versions disagree")

        history.sort(key=lambda row: (row["date"], row["employee_id"], row["event_id"], row["record_id"]))
        return OfficialDataset(
            meta=employee_root.get("meta", {}),
            proficiency_scale=skill_root.get("proficiency_scale", {}),
            employees=tuple(employees),
            employees_by_id=employees_by_id,
            events=tuple(events),
            events_by_id=events_by_id,
            skills_by_id=skills_by_id,
            role_profiles=tuple(profiles),
            role_profiles_by_key=profiles_by_key,
            history=tuple(history),
        )


@lru_cache(maxsize=1)
def load_default_dataset() -> OfficialDataset:
    return OfficialDataLoader().load()


def employee_skill_level(employee: dict[str, Any], skill_id: str) -> int:
    """Official rule: a skill omitted from an employee profile is level zero."""

    return int(employee.get("skills", {}).get(skill_id, 0))


def resolve_career_target(employee: dict[str, Any]) -> tuple[str, str, str]:
    """Return target role, grade, and whether it was explicit or inferred."""

    goal = employee.get("career_goal")
    if goal:
        return goal["target_role"], goal["target_grade"], "career_goal"
    grade_index = GRADE_ORDER.index(employee["grade"])
    target_grade = GRADE_ORDER[min(grade_index + 1, len(GRADE_ORDER) - 1)]
    source = "current_grade" if target_grade == employee["grade"] else "next_grade"
    return employee["role"], target_grade, source
