"""Pages as markdown for LLM agents (kb/pagemd.py): no raw figure/diagram fences, no quiz answers."""

from __future__ import annotations

import json

import pytest
from kb import pagemd
from kb.paths import ROOT
from kb.schema import ProblemError


def _pages() -> list[tuple[str, str, str]]:
    pages = [("lesson", p.parts[-4], p.parts[-2]) for p in sorted(ROOT.glob("*/learn/*/lesson.json"))]
    for subject in ("system-design", "ood"):
        for meta in sorted((ROOT / subject / "problems").glob("*/meta.json")):
            pages += [("design", subject, meta.parent.name), ("solution", subject, meta.parent.name)]
    return pages


@pytest.mark.parametrize(("kind", "subject", "slug"), _pages())
def test_every_page_renders_without_raw_fences(kind: str, subject: str, slug: str) -> None:
    md = pagemd.build(kind, subject, slug)
    assert md.startswith("# ") and md.endswith("\n")
    assert "```figure" not in md and "```diagram" not in md
    assert "(missing figure" not in md and "(missing diagram" not in md


def test_lesson() -> None:
    md = pagemd.build("lesson", "algo", "sliding-window")
    assert md.count("\n# ") == 0  # one H1 (the lesson's own), not a duplicate
    assert "### Trace: Fixed window" in md and "```python\ndef max_sum_size_k" in md
    assert "## Quiz" in md and "## Practice problems" in md and "`contains-duplicate-ii`" in md
    quiz = json.loads((ROOT / "algo/learn/sliding-window/quiz.json").read_text())
    for item in quiz["items"]:
        assert item["prompt"] in md and item["why"] not in md  # options yes, explanations no


def test_lesson_figures_become_mermaid() -> None:
    md = pagemd.build("lesson", "ood", "behavioral-patterns")
    assert "```mermaid\nclassDiagram" in md and "```mermaid\nflowchart TD" in md


def test_design_solution() -> None:
    md = pagemd.build("solution", "system-design", "ad-click-aggregator")
    assert md.startswith("# Solution: ad click aggregator\n\n- **Technologies:**")
    assert "**Design v1**" in md and "**Part P1:" in md and "## Estimates" in md


def test_problem_is_the_readme() -> None:
    readme = (ROOT / "algo/problems/two-sum/README.md").read_text()
    assert pagemd.build("problem", "algo", "two-sum") == readme.rstrip() + "\n"


@pytest.mark.parametrize(
    ("kind", "subject", "slug"),
    [("page", "algo", "two-sum"), ("lesson", "algo", "nope"), ("problem", "algo", "../x"), ("design", "algo", "x")],
)
def test_unknown_pages(kind: str, subject: str, slug: str) -> None:
    with pytest.raises(ProblemError):
        pagemd.build(kind, subject, slug)
