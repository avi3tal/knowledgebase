"""Filesystem locations used by kb."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATES = ROOT / "templates"
TOOLS = ROOT / "tools"


def problems_dir(problem_type: str = "algo") -> Path:
    """Directory holding problems; overridable with KB_PROBLEMS_DIR (used by tests)."""
    override = os.environ.get("KB_PROBLEMS_DIR")
    if override:
        return Path(override).resolve()
    return ROOT / problem_type / "problems"
