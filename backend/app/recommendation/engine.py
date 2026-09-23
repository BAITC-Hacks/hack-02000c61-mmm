from typing import Any, Protocol, Sequence


class RecommendationEngine(Protocol):
    """Contract for ranking activities after official data is normalized."""

    def rank(
        self,
        employee: Any,
        activities: Sequence[Any],
        history: Sequence[Any],
    ) -> Sequence[Any]:
        ...


# Planned score components (weights intentionally undefined until data review):
# - skill gap factor
# - next-grade importance
# - activity relevance
# - positive history signal
# - repeated skip penalty
# - refusal penalty
# - repetition penalty

