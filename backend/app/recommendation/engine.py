"""Eligibility, what-if simulation, and explainable activity ranking."""

from __future__ import annotations

import math
from collections.abc import Callable, Sequence
from typing import Any

from app.progress.service import calculate_readiness
from app.services.data_loader import OfficialDataset, REPEATABLE_EVENT_IDS, resolve_career_target


EngagementPredictor = Callable[[dict[str, Any], dict[str, Any]], float | None]
FINALIZED_OUTCOMES = frozenset({"completed", "dropped", "no_show", "declined"})


def simulate_activity(
    dataset: OfficialDataset,
    employee: dict[str, Any],
    event: dict[str, Any],
    *,
    skills: dict[str, int] | None = None,
) -> dict[str, Any]:
    before_skills = dict(skills if skills is not None else employee.get("skills", {}))
    after_skills = dict(before_skills)
    changes = []
    for effect in event["develops_skills"]:
        skill_id = effect["skill_id"]
        before = int(after_skills.get(skill_id, 0))
        after = min(before + int(effect["gain"]), int(effect["max_level"]))
        after_skills[skill_id] = after
        changes.append({
            "skill_id": skill_id,
            "skill_name": dataset.skills_by_id[skill_id]["name"],
            "before": before,
            "after": after,
            "gain_applied": after - before,
            "configured_gain": int(effect["gain"]),
            "max_level": int(effect["max_level"]),
        })
    before = calculate_readiness(dataset, employee, skills_override=before_skills)
    after = calculate_readiness(dataset, employee, skills_override=after_skills)
    before_critical = {item["skill_id"] for item in before["critical_gaps"]}
    after_critical = {item["skill_id"] for item in after["critical_gaps"]}
    return {
        "employee_id": employee["employee_id"],
        "event_id": event["event_id"],
        "activity_name": event["title"],
        "skill_changes": changes,
        "readiness_before": before["readiness_percentage"],
        "readiness_after": after["readiness_percentage"],
        "readiness_delta": round(after["readiness_percentage"] - before["readiness_percentage"], 2),
        "critical_gaps_before": before["critical_gaps"],
        "critical_gaps_after": after["critical_gaps"],
        "critical_gaps_closed": sorted(before_critical - after_critical),
        "projected_skills": after_skills,
    }


class CareerRecommendationEngine:
    """Rules determine relevance; ML can only adjust a relevant score by ±10%."""

    def __init__(
        self,
        dataset: OfficialDataset,
        engagement_predictor: EngagementPredictor | None = None,
    ) -> None:
        self.dataset = dataset
        self.engagement_predictor = engagement_predictor

    def eligibility(
        self,
        employee: dict[str, Any],
        event: dict[str, Any],
        *,
        skills: dict[str, int] | None = None,
        completed_event_ids: set[str] | None = None,
    ) -> dict[str, Any]:
        current_skills = skills if skills is not None else employee.get("skills", {})
        target_role, target_grade, _ = resolve_career_target(employee)
        completed = completed_event_ids or set()
        prerequisite_details = [
            {
                "skill_id": skill_id,
                "skill_name": self.dataset.skills_by_id[skill_id]["name"],
                "current_level": int(current_skills.get(skill_id, 0)),
                "required_level": int(required),
                "satisfied": int(current_skills.get(skill_id, 0)) >= int(required),
            }
            for skill_id, required in event["prerequisites"].items()
        ]
        reasons = []
        if event["mandatory"]:
            reasons.append("mandatory activities are assigned, not recommended")
        if target_role not in event["target_roles"]:
            reasons.append(f"not targeted to role {target_role}")
        if target_grade not in event["target_grades"]:
            reasons.append(f"not targeted to grade {target_grade}")
        if any(not item["satisfied"] for item in prerequisite_details):
            reasons.append("one or more prerequisites are not satisfied")
        if event["event_id"] in completed and event["event_id"] not in REPEATABLE_EVENT_IDS:
            reasons.append("already completed and non-repeatable")
        snapshot_date = str(self.dataset.meta.get("as_of_date", ""))
        has_future_session = any(str(session) >= snapshot_date for session in event["upcoming_sessions"])
        if event["format"] != "self_paced" and not has_future_session:
            reasons.append("no upcoming session is available")

        readiness = calculate_readiness(self.dataset, employee, skills_override=current_skills)
        gaps = {item["skill_id"]: item for item in readiness["gaps"]}
        relevant_effects = []
        for effect in event["develops_skills"]:
            skill_id = effect["skill_id"]
            if skill_id not in gaps:
                continue
            before = int(current_skills.get(skill_id, 0))
            projected = min(before + int(effect["gain"]), int(effect["max_level"]))
            if projected > before:
                relevant_effects.append({**effect, "effective_gain": projected - before})
        if not relevant_effects:
            reasons.append("does not improve a current target-grade gap")
        return {
            "eligible": not reasons,
            "reasons": reasons,
            "target_role_match": target_role in event["target_roles"],
            "target_grade_match": target_grade in event["target_grades"],
            "prerequisites_satisfied": all(item["satisfied"] for item in prerequisite_details),
            "prerequisites": prerequisite_details,
            "relevant_effects": relevant_effects,
        }

    def _history_rate(self, employee_id: str, event_type: str, history: Sequence[dict[str, Any]]) -> tuple[float, int]:
        outcomes = []
        for row in history:
            if row["employee_id"] != employee_id or row["status"] not in FINALIZED_OUTCOMES:
                continue
            historic_event = self.dataset.events_by_id[row["event_id"]]
            if historic_event["mandatory"] or historic_event["type"] != event_type:
                continue
            outcomes.append(row["status"] == "completed")
        if not outcomes:
            return 0.5, 0
        return sum(outcomes) / len(outcomes), len(outcomes)

    def _score(
        self,
        employee: dict[str, Any],
        event: dict[str, Any],
        history: Sequence[dict[str, Any]],
        eligibility: dict[str, Any],
        simulation: dict[str, Any],
        skills: dict[str, int],
    ) -> dict[str, Any]:
        readiness = calculate_readiness(self.dataset, employee, skills_override=skills)
        gaps = {item["skill_id"]: item for item in readiness["gaps"]}
        weighted_total_gap = sum(item["gap"] * item["weight"] for item in gaps.values()) or 1.0
        addressed = 0.0
        critical_addressed = 0.0
        total_critical_gap = sum(item["gap"] for item in gaps.values() if item["critical"]) or 1.0
        actual_gain = 0
        configured_gain = 0
        affected = []
        changes = {item["skill_id"]: item for item in simulation["skill_changes"]}
        for effect in eligibility["relevant_effects"]:
            skill_id = effect["skill_id"]
            gap = gaps[skill_id]
            change = changes[skill_id]
            useful_gain = min(gap["gap"], change["gain_applied"])
            addressed += useful_gain * gap["weight"]
            actual_gain += useful_gain
            configured_gain += int(effect["gain"])
            if gap["critical"]:
                critical_addressed += useful_gain
            affected.append({
                "skill_id": skill_id,
                "skill_name": gap["skill_name"],
                "current_level": gap["current_level"],
                "required_level": gap["required_level"],
                "gap": gap["gap"],
                "projected_level": change["after"],
                "gain_applied": change["gain_applied"],
                "critical": gap["critical"],
            })

        history_rate, history_count = self._history_rate(employee["employee_id"], event["type"], history)
        components = {
            "skill_gap_coverage": 35.0 * addressed / weighted_total_gap,
            "critical_skill_relevance": 20.0 * critical_addressed / total_critical_gap,
            "actual_impact": 15.0 * actual_gain / configured_gain if configured_gain else 0.0,
            "readiness_delta": 25.0 * min(simulation["readiness_delta"] / 10.0, 1.0),
            "history": 5.0 * history_rate,
        }
        components = {key: round(value, 3) for key, value in components.items()}
        career_score = round(sum(components.values()), 3)
        probability = None
        ml_status = "not_configured"
        if self.engagement_predictor is not None:
            try:
                value = self.engagement_predictor(employee, event)
                if value is None or not math.isfinite(float(value)) or not 0 <= float(value) <= 1:
                    raise ValueError("invalid completion probability")
                probability = round(float(value), 6)
                ml_status = "available"
            except Exception:
                ml_status = "fallback"
        multiplier = round(0.9 + 0.2 * probability, 6) if probability is not None else 1.0
        final_score = round(career_score * multiplier, 3)
        critical_names = [item["skill_name"] for item in affected if item["critical"]]
        reasons = [
            f"Addresses {len(affected)} current target-grade skill gap{'s' if len(affected) != 1 else ''}.",
            "Prerequisites satisfied.",
            f"Official gain/max-level rules improve readiness by {simulation['readiness_delta']:.2f} percentage points.",
        ]
        if critical_names:
            reasons.insert(1, f"Develops promotion-critical: {', '.join(critical_names)}.")
        if probability is not None:
            reasons.append(f"Engagement model estimates {probability * 100:.0f}% completion probability (bounded influence).")
        else:
            reasons.append("Career score used without ML adjustment; ranking remains deterministic.")
        return {
            "event_id": event["event_id"],
            "activity_name": event["title"],
            "description": event["description"],
            "type": event["type"],
            "format": event["format"],
            "duration_hours": event["duration_hours"],
            "upcoming_sessions": event["upcoming_sessions"],
            "affected_relevant_skills": affected,
            "career_score": career_score,
            "score_components": components,
            "history_completion_rate": round(history_rate, 4),
            "history_sample_count": history_count,
            "engagement_probability": probability,
            "engagement_multiplier": multiplier,
            "ml_status": ml_status,
            "final_score": final_score,
            "readiness_before": simulation["readiness_before"],
            "readiness_after": simulation["readiness_after"],
            "readiness_delta": simulation["readiness_delta"],
            "evidence": reasons,
            "prerequisites_status": {
                "satisfied": eligibility["prerequisites_satisfied"],
                "requirements": eligibility["prerequisites"],
            },
            "critical_skill_relevance": {
                "relevant": bool(critical_names),
                "skills": critical_names,
            },
            "simulation": simulation,
        }

    def rank(
        self,
        employee: dict[str, Any],
        *,
        history: Sequence[dict[str, Any]] | None = None,
        skills: dict[str, int] | None = None,
        completed_event_ids: set[str] | None = None,
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        current_skills = dict(skills if skills is not None else employee.get("skills", {}))
        employee_history = list(history if history is not None else self.dataset.history)
        completed = set(completed_event_ids or ())
        completed.update(
            row["event_id"] for row in employee_history
            if row["employee_id"] == employee["employee_id"] and row["status"] == "completed"
        )
        candidates = []
        for event in self.dataset.events:
            eligibility = self.eligibility(
                employee, event, skills=current_skills, completed_event_ids=completed
            )
            if not eligibility["eligible"]:
                continue
            simulation = simulate_activity(self.dataset, employee, event, skills=current_skills)
            candidates.append(self._score(
                employee, event, employee_history, eligibility, simulation, current_skills
            ))
        candidates.sort(key=lambda item: (-item["final_score"], -item["career_score"], item["event_id"]))
        for index, item in enumerate(candidates):
            item["rank"] = index + 1
        if len(candidates) > 1:
            first, alternative = candidates[0], candidates[1]
            component_labels = {
                "skill_gap_coverage": "target-grade gap coverage",
                "critical_skill_relevance": "critical-skill relevance",
                "actual_impact": "usable official gain",
                "readiness_delta": "readiness improvement",
                "history": "relevant participation history",
            }
            advantages = [
                component_labels[key]
                for key in component_labels
                if first["score_components"][key] > alternative["score_components"][key]
            ]
            first["comparison"] = {
                "alternative_event_id": alternative["event_id"],
                "alternative_activity_name": alternative["activity_name"],
                "summary": (
                    f"{first['activity_name']} ranks above {alternative['activity_name']} because it scores higher on "
                    f"{', '.join(advantages) if advantages else 'the combined bounded score'}."
                ),
                "advantages": advantages,
            }
        return candidates[: max(1, min(limit, 3))]


CAREER_SCORE_FORMULA = (
    "35*weighted_gap_closed/weighted_total_gap + "
    "20*critical_gap_closed/total_critical_gap + "
    "15*usable_gain/configured_relevant_gain + "
    "25*min(readiness_delta/10,1) + 5*relevant_history_completion_rate"
)
ML_MULTIPLIER_FORMULA = "final_score = career_score * (0.90 + 0.20 * completion_probability)"
