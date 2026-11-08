"""Lesson figures: fence parsing and spec validation."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from kb import figures, learn

PALETTE = {"client", "service", "cache"}
ARCH = {
    "kind": "architecture",
    "title": "t",
    "nodes": [{"id": "c", "kind": "client", "x": 0, "y": 0}, {"id": "s", "kind": "service", "x": 200, "y": 0}],
    "edges": [{"from": "c", "to": "s"}],
    "steps": [{"text": "go", "edges": ["c>s"]}],
}
SEQ = {
    "kind": "sequence",
    "title": "t",
    "actors": [{"id": "a", "label": "A"}, {"id": "b", "label": "B"}],
    "messages": [{"from": "a", "to": "b", "label": "hi"}, {"from": "b", "to": "a", "label": "no", "style": "error"}],
}
FLOW = {
    "kind": "flowchart",
    "title": "t",
    "nodes": [
        {"id": "s", "type": "start", "label": "S", "col": 0, "row": 0},
        {"id": "d", "type": "decision", "label": "?", "col": 0, "row": 1},
        {"id": "e", "type": "end", "label": "E", "col": 1, "row": 1, "tone": "bad"},
    ],
    "edges": [{"from": "s", "to": "d"}, {"from": "d", "to": "e", "label": "no"}],
}


def test_names_in_order_and_ignores_other_fences() -> None:
    md = "x\n```figure\nfirst\n```\n```python\nfigure\n```\n```figure\nsecond-one\n```\n"
    assert figures.names(md) == ["first", "second-one"]


@pytest.mark.parametrize("spec", [ARCH, SEQ, FLOW])
def test_valid_specs(spec: dict) -> None:
    assert figures.validate(spec, PALETTE) == []


@pytest.mark.parametrize(
    ("patch", "needle"),
    [
        ({"kind": "pie"}, "kind must be"),
        ({"title": ""}, "needs a 'title'"),
        ({"nodes": [{"id": "c", "kind": "robot", "x": 0, "y": 0}]}, "not a known shape"),
        ({"edges": [{"from": "c", "to": "zz"}]}, "two known nodes"),
        ({"steps": [{"text": "go", "edges": ["s>c"]}]}, "unknown nodes/edges"),
        ({"steps": [{"text": "go"}]}, "highlights nothing"),
        ({"nodes": [{"id": "c", "kind": "client"}]}, "numeric x and y"),
    ],
)
def test_architecture_errors(patch: dict, needle: str) -> None:
    assert any(needle in e for e in figures.validate({**ARCH, **patch}, PALETTE))


def test_sequence_and_flowchart_errors() -> None:
    bad_seq = {
        **SEQ,
        "messages": [{"from": "a", "to": "x", "label": "hi"}, {"from": "a", "to": "b", "label": "", "style": "x"}],
    }
    errs = figures.validate(bad_seq, PALETTE)
    assert any("known actors" in e for e in errs) and any("needs a 'label'" in e for e in errs)
    bad_flow = {
        **FLOW,
        "nodes": [{"id": "s", "type": "loop", "label": "S", "col": 0, "row": "0", "tone": "meh"}],
        "edges": [],
    }
    errs = figures.validate(bad_flow, PALETTE)
    assert (
        any("type must be" in e for e in errs)
        and any("integer col" in e for e in errs)
        and any("tone" in e for e in errs)
    )


def test_validate_markdown_reports_missing_and_loads(tmp_path: Path) -> None:
    (tmp_path / "figures").mkdir()
    (tmp_path / "figures" / "ok.json").write_text(json.dumps(SEQ))
    md = "```figure\nok\n```\n```figure\nmissing\n```\n```figure\nBad Name\n```\n"
    errs = figures.validate_markdown(tmp_path, md, "w", PALETTE)
    assert any("'missing' has no figures/missing.json" in e for e in errs)
    assert any("kebab-case" in e for e in errs)
    assert list(figures.load_all(tmp_path, md)) == ["ok"]


def test_resolved_lesson_inlines_figures() -> None:
    lesson = learn.resolve("system-design", "rate-limiting")
    md = [b for b in lesson["blocks"] if b["type"] == "markdown"]
    inlined = {name for b in md for name in b.get("figures", {})}
    assert {"placement", "three-requests", "token-bucket-flow", "race"} <= inlined


def test_scenarios_validate_merged_and_report_mistakes() -> None:
    ok = {
        **ARCH,
        "scenarios": [
            {"name": "Down", "tone": "failure", "steps": [{"text": "x", "fail": ["s", "c>s"]}]},
            {
                "name": "Alt",
                "tone": "alternative",
                "nodes": [{"id": "c", "kind": "client", "x": 0, "y": 0}],
                "edges": [],
                "steps": [{"text": "y", "nodes": ["c"]}],
            },
        ],
    }
    assert figures.validate(ok, PALETTE) == []
    bad = {
        **ARCH,
        "scenarios": [
            {"name": "How it works", "tone": "meh", "steps": [{"text": "x", "fail": ["zz"]}], "colour": 1},
            {"name": "Empty"},
            {"tone": "edge"},
        ],
    }
    errs = "\n".join(figures.validate(bad, PALETTE))
    for needle in (
        "duplicate scenario name",
        "tone must be",
        "unknown fields",
        "unknown nodes/edges",
        "changes nothing",
        "needs a 'name'",
    ):
        assert needle in errs
    lost = {**SEQ, "messages": [{"from": "a", "to": "b", "label": "reply", "style": "lost"}]}
    assert figures.validate(lost, PALETTE) == []
