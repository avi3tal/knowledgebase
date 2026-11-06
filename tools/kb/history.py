"""Structured practice history (JSONL under progress/), the input to `kb feedback`.

progress/runs.jsonl  one line per `kb run` of an attempt
progress/quiz.jsonl  one line per answered quiz item
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
from pathlib import Path
from typing import Any

from kb.paths import ROOT

_RUN_LINE = re.compile(r"^- (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) · (?:(\d+)/(\d+) passed|error)(?: · ≈(.+))?$")


def progress_dir() -> Path:
    override = os.environ.get("KB_PROGRESS_DIR")
    return Path(override) if override else ROOT / "progress"


def _append(name: str, record: dict[str, Any]) -> None:
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


def backfill_from_notes(problems: Path, subject: str = "algo") -> int:
    """One-off import of the `## Runs` lines that `kb run` wrote to notes.md before runs.jsonl existed."""
    seen = {(r.get("slug"), r.get("attempt"), r.get("ts")) for r in runs()}
    added = 0
    for notes in sorted(problems.glob("*/attempts/*/notes.md")):
        attempt, slug = notes.parent.name, notes.parent.parent.parent.name
        lang = "go" if (notes.parent / "solution.go").exists() else "python"
        for line in notes.read_text().splitlines():
            m = _RUN_LINE.match(line.strip())
            if not m:
                continue
            ts = m.group(1).replace(" ", "T") + ":00"
            if (slug, attempt, ts) in seen:
                continue
            passed, total = (int(m.group(2)), int(m.group(3))) if m.group(2) else (0, 0)
            _append(
                "runs.jsonl",
                {
                    "ts": ts,
                    "subject": subject,
                    "slug": slug,
                    "attempt": attempt,
                    "lang": lang,
                    "passed": passed,
                    "total": total,
                    "error": m.group(2) is None,
                    "fit": m.group(4),
                    "verdict": None,
                    "backfilled": True,
                },
            )
            added += 1
    return added
