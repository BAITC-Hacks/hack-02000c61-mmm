from typing import Any, Protocol, Sequence


class AnalyticsService(Protocol):
    """Computes HR aggregates from future normalized records."""

    def summarize(self, employees: Sequence[Any]) -> dict[str, Any]:
        ...

