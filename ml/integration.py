"""Safe, bounded integration of ML engagement into deterministic ranking."""

from __future__ import annotations

import math


def engagement_multiplier(
    completion_probability: float | None,
    *,
    available: bool = True,
) -> float:
    """Map a valid probability to [0.90, 1.10]; unavailable ML is neutral."""

    if not available or completion_probability is None:
        return 1.0
    try:
        probability = float(completion_probability)
    except (TypeError, ValueError):
        return 1.0
    if not math.isfinite(probability):
        return 1.0
    probability = min(1.0, max(0.0, probability))
    return 0.9 + 0.2 * probability

