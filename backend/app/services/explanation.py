from typing import Any, Protocol


class ExplanationService(Protocol):
    """Turns ranked evidence into prose; it never selects or ranks activities."""

    def explain(self, evidence: dict[str, Any]) -> str:
        ...


class EvidenceTemplateFallback:
    """Safe fallback used when a future LLM integration is unavailable."""

    def explain(self, evidence: dict[str, Any]) -> str:
        reasons = evidence.get("reasons")
        if not isinstance(reasons, list) or not reasons:
            return "This activity was selected from the available recommendation evidence."

        grounded_reasons = [str(reason) for reason in reasons if reason]
        return " ".join(grounded_reasons)

