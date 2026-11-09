"""Lesson figures: fence parsing and spec validation."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from kb import figures, learn, trace
from kb.structs import ListNode, TreeNode

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


# ------------------------------------------------------------------ uml

UML = {
    "kind": "uml",
    "title": "t",
    "classes": [
        {"id": "shape", "name": "Shape", "stereotype": "abstract", "methods": ["+ area(): float"], "x": 0, "y": 0},
        {"id": "circle", "name": "Circle", "fields": ["- r: float"], "methods": ["+ area(): float"], "x": 0, "y": 200},
        {"id": "canvas", "name": "Canvas", "fields": ["- shapes: list[Shape]"], "x": 300, "y": 0},
        {"id": "size", "name": "Size", "stereotype": "enum", "fields": ["SMALL", "LARGE"], "x": 300, "y": 200},
    ],
    "relations": [
        {"from": "circle", "to": "shape", "type": "inherits"},
        {"from": "canvas", "to": "shape", "type": "aggregation", "from_mult": "1", "to_mult": "*"},
        {"from": "circle", "to": "size", "type": "dependency", "label": "uses"},
    ],
    "steps": [{"text": "is-a", "nodes": ["circle", "shape"], "edges": ["circle>shape"]}],
}


def test_uml_valid_with_scenario() -> None:
    spec = {**UML, "scenarios": [{"name": "Broken", "tone": "failure", "steps": [{"text": "x", "fail": ["shape"]}]}]}
    assert figures.validate(spec, set()) == []


@pytest.mark.parametrize(
    ("patch", "needle"),
    [
        (
            {"classes": [{"id": "a", "name": "A", "x": 0, "y": 0}, {"id": "a", "name": "B", "x": 1, "y": 1}]},
            "duplicate",
        ),
        ({"classes": []}, "non-empty 'classes'"),
        ({"classes": [{"id": "a", "name": "A", "x": "0", "y": 0}]}, "numeric x and y"),
        ({"classes": [{"id": "a", "name": "", "x": 0, "y": 0}]}, "needs a 'name'"),
        ({"classes": [{"id": "a", "name": "A", "stereotype": "mixin", "x": 0, "y": 0}]}, "stereotype"),
        ({"classes": [{"id": "a", "name": "A", "fields": [{"n": 1}], "x": 0, "y": 0}]}, "list of strings"),
        ({"relations": [{"from": "circle", "to": "shape", "type": "extends"}]}, "type must be"),
        ({"relations": [{"from": "circle", "to": "nope", "type": "inherits"}]}, "two known classes"),
        ({"relations": [{"from": "circle", "to": "shape", "type": "inherits", "to_mult": 1}]}, "must be a string"),
        ({"relations": [{"from": "circle", "to": "shape", "type": "inherits"}] * 2}, "drawn twice"),
        ({"steps": [{"text": "x", "edges": ["shape>circle"]}]}, "unknown nodes/edges"),
        ({"steps": [{"text": "x"}]}, "highlights nothing"),
    ],
)
def test_uml_errors(patch: dict, needle: str) -> None:
    errs = figures.validate({**UML, **patch}, set())
    assert any(needle in e for e in errs), errs


# ------------------------------------------------------------------ structure

STRUCT = {
    "kind": "structure",
    "title": "t",
    "views": [
        {"type": "array", "var": "nums", "pointers": {"L": "lo", "R": "hi"}, "window": ["lo", "hi"]},
        {"type": "vars", "vars": ["best"]},
    ],
    "frames": [
        {"text": "start", "vars": {"nums": [3, 1, 4], "lo": 0, "hi": 0, "best": 0}},
        {"text": "grow", "vars": {"hi": 2, "best": 8}},
    ],
}


def test_structure_valid_and_vars_carry_over() -> None:
    assert figures.validate(STRUCT, set()) == []
    frames = figures.normalise(STRUCT)["frames"]
    assert [f["text"] for f in frames] == ["start", "grow"]
    assert frames[1]["state"]["nums"] == {"values": [3, 1, 4], "pointers": {"L": 0, "R": 2}, "window": [0, 2]}
    assert frames[1]["state"]["vars"] == {"values": {"best": 8}}


@pytest.mark.parametrize(
    ("patch", "needle"),
    [
        ({"views": [{"type": "pie", "var": "x"}]}, "type must be one of"),
        ({"views": [{"type": "callstack"}]}, "cannot be drawn"),
        ({"frames": []}, "non-empty 'frames'"),
        ({"frames": [{"vars": {"nums": [1], "lo": 0, "hi": 0, "best": 1}}]}, "needs 'text'"),
        ({"frames": [{"text": "x", "vars": {"lo": 0, "hi": 0, "best": 1}}]}, "missing vars ['nums']"),
        ({"steps": [{"text": "x"}]}, "'frames', not 'steps'"),
        ({"types": {"nums": "Graph"}}, "'types' must map"),
    ],
)
def test_structure_errors(patch: dict, needle: str) -> None:
    errs = figures.validate({**STRUCT, **patch}, set())
    assert any(needle in e for e in errs), errs


def test_structure_tree_and_list_pointer_errors() -> None:
    tree = {
        "kind": "structure",
        "title": "t",
        "views": [{"type": "tree", "var": "root", "pointers": {"cur": "node"}}],
        "frames": [{"text": "x", "vars": {"root": [1, None, 2], "node": 1}}],
    }
    assert any("not the index of a node" in e for e in figures.validate(tree, set()))
    lst = {
        "kind": "structure",
        "title": "t",
        "views": [{"type": "linkedlist", "var": "head", "pointers": {"p": "p"}}],
        "types": {"head": "TreeNode"},
        "frames": [{"text": "x", "vars": {"head": [1, 2], "p": 5}}],
    }
    errs = "\n".join(figures.validate(lst, set()))
    assert "not the index of a node" in errs and "typed TreeNode but drawn as linkedlist" in errs


def test_structure_states_equal_tracer_snapshots() -> None:
    """Normalised frames are exactly what kb.trace.snapshot gives for the real objects."""
    views = [
        {"type": "array", "var": "a", "pointers": {"i": "i"}, "window": ["i", "j"]},
        {"type": "tree", "var": "root", "pointers": {"cur": "node"}, "groups": {"path": "path"}},
        {"type": "linkedlist", "var": "head", "pointers": {"slow": "s", "fast": "f"}},
        {"type": "grid", "var": "dp", "cells": {"at": ["r", "c"]}, "row_labels": "x", "col_labels": "y"},
        {"type": "map", "var": "seen"},
    ]
    plain = {
        "a": [5, 6, 7],
        "i": 0,
        "j": 1,
        "root": [4, 2, 6, None, 3, None, 7],
        "node": 4,
        "path": [0, 1, 4],
        "head": [1, 2, 3],
        "s": 1,
        "f": None,
        "dp": [[0, 0], [0, 1]],
        "r": 1,
        "c": 1,
        "x": "a",
        "y": "b",
        "seen": {"k": 2},
    }
    spec = {"kind": "structure", "title": "t", "views": views, "frames": [{"text": "x", "vars": plain}]}
    assert figures.validate(spec, set()) == []
    got = figures.normalise(spec)["frames"][0]["state"]

    root = TreeNode.from_list(plain["root"])
    three = root.left.right
    head = ListNode.from_list(plain["head"])
    real = {**plain, "root": root, "node": three, "path": [root, root.left, three], "head": head, "s": head.next}
    want = {}
    for v in views:  # one registry per view, as each figure frame numbers its nodes afresh
        want.update(trace.snapshot([v], real, trace.NodeRegistry()))
    assert got == want
    assert got["root"]["pointers"] == {"cur": 3} and got["root"]["groups"] == {"path": [0, 1, 3]}
    assert got["head"]["pointers"] == {"slow": 1, "fast": None}


def test_structure_matches_shared_fixture() -> None:
    """studio/src/figures.test.ts reads the same normalised figure — regenerate both together."""
    testdata = Path(__file__).parent / "testdata"
    spec = json.loads((testdata / "figure_structure_spec.json").read_text())
    assert figures.validate(spec, set()) == []
    assert figures.normalise(spec) == json.loads((testdata / "figure_structure_fixture.json").read_text())


def test_structure_graph_view_and_load_all(tmp_path: Path) -> None:
    g = {
        "nodes": [{"id": "a", "x": 0, "y": 0}, {"id": "b", "x": 100, "y": 0}],
        "edges": [{"from": "a", "to": "b", "w": 4, "directed": True}],
        "highlight": {"nodes": ["a"], "edges": ["a>b"]},
        "labels": {"b": "d=4"},
    }
    frames = [{"text": "x", "vars": {"g": g}}]
    spec = {"kind": "structure", "title": "t", "views": [{"type": "graph", "var": "g"}], "frames": frames}
    assert figures.validate(spec, set()) == []
    (tmp_path / "figures").mkdir()
    (tmp_path / "figures" / "g.json").write_text(json.dumps(spec))
    loaded = figures.load_all(tmp_path, "```figure\ng\n```\n")["g"]
    assert loaded["frames"][0]["state"]["g"] == g
    bad = {**spec, "frames": [{"text": "x", "vars": {"g": {**g, "highlight": {"edges": ["a>z"]}}}}]}
    assert any("highlight names unknown" in e for e in figures.validate(bad, set()))
    (tmp_path / "figures" / "g.json").write_text(json.dumps(bad))
    assert figures.load_all(tmp_path, "```figure\ng\n```\n") == {}  # broken specs are left out, not raised
