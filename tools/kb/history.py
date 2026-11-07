"""Structured practice history, the input to `kb feedback`. Private: lives in the workspace.

<workspace>/progress/runs.jsonl  one line per `kb run` of an attempt
<workspace>/progress/quiz.jsonl  one line per answered quiz item
"""

from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
from typing import Any

from kb.paths import ensure_workspace, workspace_dir


def progress_dir() -> Path:
    override = os.environ.get("KB_PROGRESS_DIR")
    return Path(override) if override else workspace_dir() / "progress"


def _append(name: str, record: dict[str, Any]) -> None:
    if "KB_PROGRESS_DIR" not in os.environ:
        ensure_workspace()
    path = progress_dir() / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a") as f:
        f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")


def _read(name: str) -> list[dict[str, Any]]:
    path = progress_dir() / name
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def now() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def record_run(record: dict[str, Any]) -> None:
    _append("runs.jsonl", {"ts": now(), **record})


def record_quiz(record: dict[str, Any]) -> None:
    _append("quiz.jsonl", {"ts": now(), **record})


def runs() -> list[dict[str, Any]]:
    return _read("runs.jsonl")


def quiz_answers() -> list[dict[str, Any]]:
    return _read("quiz.jsonl")


def is_legacy(attempt: str) -> bool:
    return "_legacy" in attempt
