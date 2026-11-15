"""Figure specs -> Mermaid / markdown (kb/mermaid.py). Every real figure is also parsed by the real
Mermaid parser during development; these tests pin the shape of each kind and the escaping."""

from __future__ import annotations

from typing import Any

import pytest
from kb import mermaid

ARCH = {
    "kind": "architecture",
    "title": "Cache aside",
    "caption": "Reads hit the cache first.",
    "nodes": [
        {"id": "end", "kind": "service", "label": 'API "v2"; public'},
        {"id": "db-1", "kind": "sql", "label": "Users DB"},
    ],
    "edges": [{"from": "end", "to": "db-1", "label": "read | write"}],
    "steps": [{"text": "Query", "nodes": ["end"]}, {"text": "DB down", "fail": {"nodes": ["db-1"]}}],
}
FLOW = {
    "kind": "flowchart",
    "nodes": [
        {"id": "s", "type": "start", "label": "req", "col": 0, "row": 0},
        {"id": "d", "type": "decision", "label": "ok?", "col": 0, "row": 1},
        {"id": "e", "type": "end", "label": "done", "col": 0, "row": 2, "tone": "good"},
    ],
    "edges": [{"from": "s", "to": "d"}, {"from": "d", "to": "e", "label": "yes"}],
}
SEQ = {
    "kind": "sequence",
    "actors": [{"id": "c", "label": "Client"}, {"id": "s", "label": "Server"}],
    "messages": [
        {"from": "c", "to": "s", "label": "GET /x", "note": "first call"},
        {"from": "s", "to": "c", "label": "200", "style": "reply"},
        {"from": "s", "to": "s", "label": "retry", "style": "self", "note": "loop"},
        {"from": "c", "to": "s", "label": "ping", "style": "lost"},
    ],
}
UML = {
    "kind": "uml",
    "classes": [
        {"id": "shape", "name": "Shape", "stereotype": "interface", "methods": ["+ area(): float"], "x": 0, "y": 0},
        {"id": "sq", "name": "Square", "fields": ["- side: float"], "x": 0, "y": 100},
        {"id": "cv", "name": "Canvas", "x": 200, "y": 0},
    ],
    "relations": [
        {"from": "sq", "to": "shape", "type": "implements"},
        {"from": "cv", "to": "shape", "type": "aggregation", "from_mult": "1", "to_mult": "*", "label": "draws"},
        {"from": "cv", "to": "sq", "type": "association", "navigable": True},
    ],
}
STRUCT = {
    "kind": "structure",
    "frames": [{"text": "start", "vars": {"i": 0, "seen": [1]}}, {"text": "clear i", "vars": {"i": None}}],
}


@pytest.mark.parametrize(
    ("spec", "expected"),
    [
        (ARCH, ["flowchart LR", 'n_end["API #quot;v2#quot;#59; public<br/><i>service</i>"]', 'n_db_1[("Users DB']),
        (ARCH, ['n_end -->|"read | write"| n_db_1']),
        (FLOW, ["flowchart TD", 'n_s(["req"])', 'n_d{"ok?"}', 'n_e(["done (good)"])', 'n_d -->|"yes"| n_e']),
        (SEQ, ["sequenceDiagram", "autonumber", "participant p_c as Client", "p_c->>p_s: GET /x"]),
        (SEQ, ["Note over p_c,p_s: first call", "p_s-->>p_c: 200", "Note over p_s: loop", "p_c--xp_s: ping (lost)"]),
        (
            UML,
            ['class c_shape["Shape"] {', "<<interface>>", "+area(): float", "-side: float", 'class c_cv["Canvas"]\n'],
        ),
        (UML, ["c_shape <|.. c_sq", 'c_cv "1" o-- "*" c_shape : draws', "c_cv --> c_sq"]),
        (STRUCT, ['1. start\n   `{"i": 0, "seen": [1]}`', '2. clear i\n   `{"seen": [1]}`']),
    ],
)
def test_picture(spec: dict[str, Any], expected: list[str]) -> None:
    out = mermaid.picture(spec)
    for piece in expected:
        assert piece in out


def test_figure_md_title_caption_steps() -> None:
    out = mermaid.figure_md(ARCH)
    assert out.startswith("**Figure: Cache aside**\n\n```mermaid\n")
    assert "_Reads hit the cache first._" in out
    assert "1. Query\n2. DB down (fails: db-1)" in out


@pytest.mark.parametrize(
    ("scenario", "has_picture"),
    [
        ({"name": "Outage", "tone": "failure", "steps": [{"text": "boom"}]}, False),
        ({"name": "Bigger", "tone": "scale", "nodes": [{"id": "x", "kind": "cache", "label": "X"}], "edges": []}, True),
    ],
)
def test_scenarios(scenario: dict[str, Any], has_picture: bool) -> None:
    out = mermaid.figure_md({**ARCH, "scenarios": [scenario]})
    assert f"Scenario: **{scenario['name']}** ({scenario['tone']})" in out
    assert out.count("```mermaid") == (2 if has_picture else 1)


def test_unknown_kind_falls_back_to_json() -> None:
    assert mermaid.picture({"kind": "mystery", "a": 1}).startswith("```json\n")
