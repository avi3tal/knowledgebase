"""Lesson figures: real diagrams embedded in lesson markdown instead of ASCII sketches.

A markdown file embeds a figure with a fenced block whose body is the figure's name:

    ```figure
    placement
    ```

and the spec lives in `<lesson>/figures/<name>.json`. `kb learn validate` checks every spec; the
studio API inlines the specs next to the markdown (`figures: {name: spec}`) and the studio renders
them (DiagramCanvas for architecture, its own SVG for sequence and flowchart). Kinds:

- architecture: `nodes [{id, kind, label, sub?, x, y}]`, `edges [{from, to, label?}]` — the design
  console's shapes (`kind` from the system-design / ood palette; `sub` replaces the shape name under
  the label), plus optional numbered `steps`.
- sequence: `actors [{id, label, kind?}]`, `messages [{from, to, label, style?, note?}]`; every
  message is a numbered step (`style`: call | reply | error | async | self).
- flowchart: `nodes [{id, type, label, col, row, tone?}]` (`type`: start | step | decision | end;
  `tone`: good | bad colours an outcome),
  `edges [{from, to, label?}]` (label decision branches "yes" / "no"), optional `steps`.

Every kind takes `title` and optional `caption`. `steps [{text, nodes?, edges?}]` highlight nodes and
edges (`"from>to"`) one step at a time with narration underneath.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

FENCE_RE = re.compile(r"^```figure[ \t]*\n([^\n`]*)\n```", re.M)
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
KINDS = {"architecture", "sequence", "flowchart"}
FLOW_TYPES = {"start", "step", "decision", "end"}
MESSAGE_STYLES = {"call", "reply", "error", "async", "self"}


def names(markdown: str) -> list[str]:
    """Figure names a markdown file embeds, in order."""
    return [m.group(1).strip() for m in FENCE_RE.finditer(markdown)]


def path(ldir: Path, name: str) -> Path:
    return ldir / "figures" / f"{name}.json"


def load_all(ldir: Path, markdown: str) -> dict[str, Any]:
    """name -> spec for every figure the markdown embeds (missing files are left out; validate reports them)."""
    out: dict[str, Any] = {}
    for name in names(markdown):
        p = path(ldir, name)
        if NAME_RE.match(name) and p.is_file():
            out[name] = json.loads(p.read_text())
    return out


def validate_markdown(ldir: Path, markdown: str, where: str, palette: set[str]) -> list[str]:
    errors: list[str] = []
    for name in names(markdown):
        if not NAME_RE.match(name):
            errors.append(f"{where}: figure name {name!r} must be kebab-case")
            continue
        p = path(ldir, name)
        if not p.is_file():
            errors.append(f"{where}: figure {name!r} has no figures/{name}.json")
            continue
        try:
            spec = json.loads(p.read_text())
        except json.JSONDecodeError as e:
            errors.append(f"{where}: figures/{name}.json is not valid JSON ({e})")
            continue
        errors += [f"{where}: figure {name!r}: {msg}" for msg in validate(spec, palette)]
    return errors


def _ids(items: Any, what: str, errors: list[str]) -> set[str]:
    if not isinstance(items, list) or not items:
        errors.append(f"needs a non-empty '{what}' list")
        return set()
    ids = [x.get("id") for x in items if isinstance(x, dict)]
    if len(ids) != len(items) or not all(isinstance(i, str) and i for i in ids):
        errors.append(f"every {what[:-1]} needs an 'id'")
    if len(set(ids)) != len(ids):
        errors.append(f"duplicate {what[:-1]} ids")
    return {i for i in ids if isinstance(i, str)}


def _edges(spec: dict[str, Any], node_ids: set[str], errors: list[str]) -> set[str]:
    keys: set[str] = set()
    for e in spec.get("edges", []):
        if not isinstance(e, dict) or e.get("from") not in node_ids or e.get("to") not in node_ids:
            errors.append(f"edge {e!r} must join two known nodes")
            continue
        keys.add(f"{e['from']}>{e['to']}")
    return keys


def _steps(spec: dict[str, Any], node_ids: set[str], edge_keys: set[str], errors: list[str]) -> None:
    steps = spec.get("steps", [])
    if not isinstance(steps, list):
        errors.append("'steps' must be a list")
        return
    for i, s in enumerate(steps, 1):
        if not isinstance(s, dict) or not str(s.get("text", "")).strip():
            errors.append(f"step {i} needs 'text'")
            continue
        bad = [n for n in s.get("nodes", []) if n not in node_ids] + [
            e for e in s.get("edges", []) if e not in edge_keys
        ]
        if bad:
            errors.append(f"step {i} highlights unknown nodes/edges {bad}")
        if not s.get("nodes") and not s.get("edges"):
            errors.append(f"step {i} highlights nothing")


def validate(spec: Any, palette: set[str]) -> list[str]:
    """Problems with one figure spec; `palette` = node kinds an architecture figure may use."""
    if not isinstance(spec, dict):
        return ["spec must be an object"]
    errors: list[str] = []
    kind = spec.get("kind")
    if kind not in KINDS:
        return [f"kind must be one of {sorted(KINDS)}"]
    if not str(spec.get("title", "")).strip():
        errors.append("needs a 'title'")
    if kind == "architecture":
        node_ids = _ids(spec.get("nodes"), "nodes", errors)
        for n in spec.get("nodes", []):
            if isinstance(n, dict) and n.get("kind") not in palette:
                errors.append(f"node {n.get('id')!r}: kind {n.get('kind')!r} is not a known shape")
            numeric = isinstance(n, dict) and all(isinstance(n.get(k), int | float) for k in ("x", "y"))
            if isinstance(n, dict) and not numeric:
                errors.append(f"node {n.get('id')!r} needs numeric x and y")
        _steps(spec, node_ids, _edges(spec, node_ids, errors), errors)
    elif kind == "flowchart":
        node_ids = _ids(spec.get("nodes"), "nodes", errors)
        for n in spec.get("nodes", []):
            if isinstance(n, dict) and n.get("type") not in FLOW_TYPES:
                errors.append(f"node {n.get('id')!r}: type must be one of {sorted(FLOW_TYPES)}")
            if isinstance(n, dict) and n.get("tone", "good") not in {"good", "bad"}:
                errors.append(f"node {n.get('id')!r}: tone must be 'good' or 'bad'")
            if isinstance(n, dict) and not (isinstance(n.get("col"), int) and isinstance(n.get("row"), int)):
                errors.append(f"node {n.get('id')!r} needs integer col and row")
        _steps(spec, node_ids, _edges(spec, node_ids, errors), errors)
    else:
        actor_ids = _ids(spec.get("actors"), "actors", errors)
        messages = spec.get("messages")
        if not isinstance(messages, list) or not messages:
            errors.append("needs a non-empty 'messages' list")
        for i, m in enumerate(messages or [], 1):
            if not isinstance(m, dict) or m.get("from") not in actor_ids or m.get("to") not in actor_ids:
                errors.append(f"message {i} must go between known actors")
            elif not str(m.get("label", "")).strip():
                errors.append(f"message {i} needs a 'label'")
            elif m.get("style", "call") not in MESSAGE_STYLES:
                errors.append(f"message {i}: style must be one of {sorted(MESSAGE_STYLES)}")
    return errors
