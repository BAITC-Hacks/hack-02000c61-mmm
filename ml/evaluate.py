"""Display the immutable metrics saved during temporal evaluation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from ml.train import DEFAULT_ARTIFACT_DIR


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--metrics", type=Path, default=DEFAULT_ARTIFACT_DIR / "metrics.json"
    )
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    metrics = json.loads(arguments.metrics.read_text(encoding="utf-8"))
    print(json.dumps(metrics, indent=2))

