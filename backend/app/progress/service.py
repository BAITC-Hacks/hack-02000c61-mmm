"""Deterministic target-grade readiness calculation."""

from __future__ import annotations

from typing import Any

from app.services.data_loader import OfficialDataset, resolve_career_target


CRITICAL_REQUIREMENT_WEIGHT = 2.0
STANDARD_REQUIREMENT_WEIGHT = 1.0


def calculate_readiness(
    dataset: OfficialDataset,
    employee: dict[str, Any],
    *,
    skills_override: dict[str, int] | None = None,
) -> dict[str, Any]:
    """Calculate weighted achievement against the exact target profile."""

    target_role, target_grade, goal_source = resolve_career_target(employee)
    profile = dataset.role_profiles_by_key.get((target_role, target_grade))
    if profile is None:
        raise ValueError(f"No role profile for {target_role} / {target_grade}")
    skills = skills_override if skills_override is not None else employee.get("skills", {})
    critical = set(profile["critical_skills"])
    requirements = []
    weighted_achievement = 0.0
    total_weight = 0.0
    satisfied = 0

    for skill_id, required_level_raw in profile["required_skills"].items():
        required_level = int(required_level_raw)
        current_level = int(skills.get(skill_id, 0))
        is_critical = skill_id in critical
        weight = CRITICAL_REQUIREMENT_WEIGHT if is_critical else STANDARD_REQUIREMENT_WEIGHT
        ratio = min(current_level / required_level, 1.0) if required_level else 1.0
        gap = max(required_level - current_level, 0)
        total_weight += weight
        weighted_achievement += weight * ratio
        satisfied += int(gap == 0)
        catalog = dataset.skills_by_id[skill_id]
        requirements.append({
            "skill_id": skill_id,
            "skill_name": catalog["name"],
            "skill_type": catalog["type"],
            "category": catalog["category"],
            "current_level": current_level,
            "required_level": required_level,
            "gap": gap,
            "satisfied": gap == 0,
            "critical": is_critical,
            "weight": weight,
            "achievement_ratio": round(ratio, 4),
        })

    readiness = 100.0 * weighted_achievement / total_weight if total_weight else 100.0
    gaps = [item for item in requirements if item["gap"] > 0]
    gaps.sort(key=lambda item: (not item["critical"], -item["gap"], item["skill_name"]))
    return {
        "current_role": employee["role"],
        "current_grade": employee["grade"],
        "target_role": target_role,
        "target_grade": target_grade,
        "goal_source": goal_source,
        "readiness_percentage": round(readiness, 2),
        "satisfied_requirements": satisfied,
        "total_requirements": len(requirements),
        "critical_gaps": [item for item in gaps if item["critical"]],
        "requirements": requirements,
        "gaps": gaps,
        "formula": (
            "100 * sum(weight * min(current_level / required_level, 1)) / sum(weight); "
            "weight=2 for critical requirements and 1 otherwise; missing skills=0"
        ),
    }
