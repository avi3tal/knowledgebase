"""Filesystem locations used by kb."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATES = ROOT / "templates"
TOOLS = ROOT / "tools"


def workspace_dir() -> Path:
    """The learner's private workspace: attempts, progress and sessions. Never committed.

    Default `<repo>/_workspace` (git-ignored; the leading `_` keeps it out of `go vet ./...`, and being
    inside the repo keeps Go attempts under the root go.mod). Overridable with KB_WORKSPACE.
    """
    override = os.environ.get("KB_WORKSPACE")
    return Path(override).resolve() if override else ROOT / "_workspace"


WORKSPACE_README = """# Your private kb workspace

Everything here is **yours** and is never committed to the platform repo (`/_workspace/` is
git-ignored):

- `attempts/<subject>/<slug>/<date>_<lang>_<pattern>/`: your solutions (`./kb attempt …`)
- `progress/runs.jsonl`, `progress/quiz.jsonl`: every `kb run` and quiz answer (input to `kb feedback`)
- `sessions/<id>/session.json`: your study sessions (`./kb session …`)

Back it up however you like, e.g. make this folder its own private git repo.
Use another location with `KB_WORKSPACE=/path` (Go attempts must stay inside the repo, under its go.mod).
"""


def ensure_workspace() -> Path:
    """Create the workspace (with its README) on first write."""
    ws = workspace_dir()
    ws.mkdir(parents=True, exist_ok=True)
    readme = ws / "README.md"
    if not readme.exists():
        readme.write_text(WORKSPACE_README)
    return ws


def attempts_root(subject: str, slug: str) -> Path:
    return workspace_dir() / "attempts" / subject / slug


def subject_of(problem_dir: Path) -> str:
    """`<subject>/problems/<slug>` -> subject; anything else (test scratch dirs) counts as algo."""
    parent = problem_dir.parent
    if parent.name == "problems" and (parent.parent / "learn" / "catalog.json").exists():
        return parent.parent.name
    return "algo"


def problems_dir(problem_type: str = "algo") -> Path:
    """Directory holding problems; overridable with KB_PROBLEMS_DIR (used by tests)."""
    override = os.environ.get("KB_PROBLEMS_DIR")
    if override:
        return Path(override).resolve()
    return ROOT / problem_type / "problems"
