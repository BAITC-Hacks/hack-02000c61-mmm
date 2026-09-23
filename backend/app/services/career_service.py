"""Application service joining official data, runtime state, and engines."""

from __future__ import annotations

from copy import deepcopy
from threading import RLock
from typing import Any

from app.analytics.service import summarize
from app.progress.service import calculate_readiness
from app.recommendation.engine import CareerRecommendationEngine, simulate_activity
from app.services.data_loader import GRADE_ORDER, OfficialDataset, load_default_dataset
from app.services.engagement import EngagementModelAdapter


class CareerQuestService:
    def __init__(
        self,
        dataset: OfficialDataset | None = None,
        *,
        engagement_predictor: Any = None,
        enable_default_ml: bool = True,
    ) -> None:
        self.dataset = dataset or load_default_dataset()
        predictor = engagement_predictor
        if predictor is None and enable_default_ml:
            predictor = EngagementModelAdapter()
        self.engine = CareerRecommendationEngine(self.dataset, predictor)
        self.deterministic_engine = CareerRecommendationEngine(self.dataset)
        self._runtime_skills: dict[str, dict[str, int]] = {}
        self._runtime_completed: dict[str, set[str]] = {}
        self._runtime_history: dict[str, list[dict[str, Any]]] = {}
        self._lock = RLock()

    def _require_employee(self, employee_id: str) -> dict[str, Any]:
        try:
            return self.dataset.employees_by_id[employee_id]
        except KeyError as error:
            raise KeyError(f"Unknown employee {employee_id}") from error

    def _require_event(self, event_id: str) -> dict[str, Any]:
        try:
            return self.dataset.events_by_id[event_id]
        except KeyError as error:
            raise KeyError(f"Unknown event {event_id}") from error

    def _assessed_plus_history_skills(self, employee: dict[str, Any]) -> dict[str, int]:
        skills = dict(employee.get("skills", {}))
        for row in self.dataset.history:
            if (
                row["employee_id"] != employee["employee_id"]
                or row["status"] != "completed"
                or row["date"] <= employee["last_review_date"]
            ):
                continue
            event = self.dataset.events_by_id[row["event_id"]]
            for effect in event["develops_skills"]:
                before = int(skills.get(effect["skill_id"], 0))
                skills[effect["skill_id"]] = min(
                    before + int(effect["gain"]), int(effect["max_level"])
                )
        return skills

    def current_skills(self, employee_id: str) -> dict[str, int]:
        employee = self._require_employee(employee_id)
        if employee_id in self._runtime_skills:
            return dict(self._runtime_skills[employee_id])
        return self._assessed_plus_history_skills(employee)

    def _completed_ids(self, employee_id: str) -> set[str]:
        official = {
            row["event_id"] for row in self.dataset.history
            if row["employee_id"] == employee_id and row["status"] == "completed"
        }
        return official | self._runtime_completed.get(employee_id, set())

    def _all_history(self, employee_id: str | None = None) -> list[dict[str, Any]]:
        rows = list(self.dataset.history)
        for runtime_rows in self._runtime_history.values():
            rows.extend(runtime_rows)
        if employee_id is not None:
            rows = [row for row in rows if row["employee_id"] == employee_id]
        return rows

    def employees(self) -> list[dict[str, Any]]:
        result = []
        for employee in self.dataset.employees:
            target = calculate_readiness(
                self.dataset, employee, skills_override=self.current_skills(employee["employee_id"])
            )
            result.append({
                "employee_id": employee["employee_id"],
                "full_name": employee["full_name"],
                "department": employee["department"],
                "role": employee["role"],
                "grade": employee["grade"],
                "target_role": target["target_role"],
                "target_grade": target["target_grade"],
                "readiness_percentage": target["readiness_percentage"],
            })
        return result

    def employee(self, employee_id: str) -> dict[str, Any]:
        employee = deepcopy(self._require_employee(employee_id))
        employee["skills"] = self.current_skills(employee_id)
        employee["career_path"] = list(GRADE_ORDER)
        employee["runtime_completed_event_ids"] = sorted(self._runtime_completed.get(employee_id, set()))
        return employee

    def career(self, employee_id: str) -> dict[str, Any]:
        employee = self._require_employee(employee_id)
        return calculate_readiness(
            self.dataset, employee, skills_override=self.current_skills(employee_id)
        )

    def recommendations(self, employee_id: str, *, use_ml: bool = True) -> list[dict[str, Any]]:
        employee = self._require_employee(employee_id)
        engine = self.engine if use_ml else self.deterministic_engine
        return engine.rank(
            employee,
            history=self._all_history(),
            skills=self.current_skills(employee_id),
            completed_event_ids=self._completed_ids(employee_id),
        )

    def history(self, employee_id: str) -> list[dict[str, Any]]:
        self._require_employee(employee_id)
        result = []
        for row in reversed(self._all_history(employee_id)):
            event = self.dataset.events_by_id[row["event_id"]]
            result.append({**row, "activity_name": event["title"], "type": event["type"]})
        return result

    def simulate(self, employee_id: str, event_id: str) -> dict[str, Any]:
        employee = self._require_employee(employee_id)
        event = self._require_event(event_id)
        simulation = simulate_activity(
            self.dataset, employee, event, skills=self.current_skills(employee_id)
        )
        simulation["eligibility"] = self.engine.eligibility(
            employee,
            event,
            skills=self.current_skills(employee_id),
            completed_event_ids=self._completed_ids(employee_id),
        )
        return simulation

    def complete(self, employee_id: str, event_id: str) -> dict[str, Any]:
        employee = self._require_employee(employee_id)
        event = self._require_event(event_id)
        with self._lock:
            skills = self.current_skills(employee_id)
            eligibility = self.engine.eligibility(
                employee, event, skills=skills, completed_event_ids=self._completed_ids(employee_id)
            )
            if not eligibility["eligible"]:
                raise ValueError("Activity is not currently eligible: " + "; ".join(eligibility["reasons"]))
            simulation = simulate_activity(self.dataset, employee, event, skills=skills)
            self._runtime_skills[employee_id] = simulation.pop("projected_skills")
            self._runtime_completed.setdefault(employee_id, set()).add(event_id)
            runtime_rows = self._runtime_history.setdefault(employee_id, [])
            runtime_rows.append({
                "record_id": f"SESSION-{employee_id}-{len(runtime_rows) + 1}",
                "employee_id": employee_id,
                "event_id": event_id,
                "date": str(self.dataset.meta.get("as_of_date", "")),
                "due_date": "",
                "status": "completed",
                "completion_pct": "100",
                "score": "",
                "feedback_rating": "",
                "assigned_by": "self",
            })
            return {
                "completed_event_id": event_id,
                "simulation": simulation,
                "career": self.career(employee_id),
                "recommendations": self.recommendations(employee_id),
                "history": self.history(employee_id),
            }

    def analytics(self) -> dict[str, Any]:
        return summarize(self)
