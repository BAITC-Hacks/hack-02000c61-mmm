from pathlib import Path
from typing import Any


class OfficialDatasetUnavailableError(RuntimeError):
    """Raised until organizer datasets and their schemas are available."""


class OfficialDataLoader:
    """Boundary for future official-file parsing and normalization.

    The return type is intentionally generic: defining source models before the
    organizer publishes the schemas would create unsupported assumptions.
    """

    def __init__(self, data_directory: Path) -> None:
        self.data_directory = data_directory

    def load(self) -> dict[str, Any]:
        raise OfficialDatasetUnavailableError(
            "Official dataset schemas are not available. See data/README.md."
        )

