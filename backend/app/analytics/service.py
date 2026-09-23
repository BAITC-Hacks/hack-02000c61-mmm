"""Organization analytics calculated from official records and engine output."""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any, Protocol


class AnalyticsDataSource(Protocol):
    dataset: Any

    def career(self, employee_id: str) -> dict[str, Any]: ...
    def recommendations(self, employee_id: str, *, use_ml: bool = True) -> list[dict[str, Any]]: ...


def summarize(source: AnalyticsDataSource) -> dict[str, Any]:
    readiness_values = []
    gap_counts: Counter[str] = Counter()
    critical_counts: Counter[str] = Counter()
    rows = []
    no_step = 0
    for employee in source.dataset.employees:
        career = source.career(employee["employee_id"])
        recommendations = source.recommendations(employee["employee_id"], use_ml=False)
        readiness_values.append(career["readiness_percentage"])
        gap_counts.update(item["skill_name"] for item in career["gaps"])
        critical_counts.update(item["skill_name"] for item in career["critical_gaps"])
        no_step += int(not recommendations)
        primary_gap = career["gaps"][0]["skill_name"] if career["gaps"] else "Ready"
        readiness = career["readiness_percentage"]
        rows.append({
            "employee_id": employee["employee_id"],
            "full_name": employee["full_name"],
            "role": employee["role"],
            "grade": employee["grade"],
            "target_role": career["target_role"],
            "target_grade": career["target_grade"],
            "readiness": readiness,
            "primary_gap": primary_gap,
            "recommendation_status": "No next step" if not recommendations else ("Review" if readiness < 50 else "Ready"),
        })

    outcomes: dict[str, Counter[str]] = defaultdict(Counter)
    for history in source.dataset.history:
        event = source.dataset.events_by_id[history["event_id"]]
        outcomes[event["type"]][history["status"]] += 1
    participation = []
    for activity_type, counts in sorted(outcomes.items()):
        participation.append({
            "activity_type": activity_type,
            "enrolled": sum(counts.values()),
            "completed": counts["completed"],
            "outcomes": dict(counts),
        })

    employee_count = len(source.dataset.employees)
    common_gaps = [
        {"skill": name, "employees": count, "percentage": round(100 * count / employee_count, 1)}
        for name, count in gap_counts.most_common(10)
    ]
    critical_gaps = [
        {"skill": name, "employees": count, "percentage": round(100 * count / employee_count, 1)}
        for name, count in critical_counts.most_common(10)
    ]

    skill_event_coverage: Counter[str] = Counter()
    for event in source.dataset.events:
        if event["mandatory"]:
            continue
        for effect in event["develops_skills"]:
            skill_event_coverage[source.dataset.skills_by_id[effect["skill_id"]]["name"]] += 1
    bottlenecks = []
    for skill, count in gap_counts.items():
        activities = skill_event_coverage[skill]
        bottlenecks.append({
            "skill": skill,
            "employees_needing_improvement": count,
            "available_activities": activities,
            "pressure_ratio": round(count / max(activities, 1), 2),
        })
    bottlenecks.sort(key=lambda item: (-item["pressure_ratio"], -item["employees_needing_improvement"], item["skill"]))

    return {
        "as_of_date": source.dataset.meta.get("as_of_date"),
        "employee_count": employee_count,
        "average_career_readiness": round(sum(readiness_values) / employee_count, 2) if employee_count else 0,
        "most_common_target_grade_skill_gaps": common_gaps,
        "critical_gap_frequency": critical_gaps,
        "participation_outcomes": participation,
        "employees_with_no_eligible_next_step": no_step,
        "development_bottlenecks": bottlenecks[:10],
        "employees": sorted(rows, key=lambda row: (row["readiness"], row["full_name"])),
    }
