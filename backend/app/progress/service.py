from typing import Any, Protocol


class ProgressCalculator(Protocol):
    """Calculates readiness only after official grade requirements are known."""

    def calculate(self, employee: Any, target_grade: Any) -> Any:
        ...

