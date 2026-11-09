"""Deterministic step traces of a reference solution, for animated lessons.

The reference code stays clean: it is executed under ``sys.settrace`` and, after every executed
line, the variables named in a *view spec* are snapshotted. ``# note: ...`` comments on a line
become the narration shown when that line has just run (the comment is stripped from the code
shown to the learner). Only steps where watched state changes (or that carry a note) are kept.

Recursion and nested helpers (``def dfs(...)`` inside the traced function) are traced too: every
frame running the function's code or a code object nested in it. Watched variables are looked up
in the current frame first, then in the outermost traced frame (so a helper can watch the outer
``visited`` set).

Trace JSON (version 1) is the contract with the studio (studio/src/trace.ts):
  {version, title, code: [lines], view: [...], input, steps: [{line, note, state}], result}
  array / heap: {values, pointers: {name: index|null}, window: [lo, hi] | null}
  map:          {entries: [[key, value], ...]}        (sets: value is null)
  vars:         {values: {name: value}}
  linkedlist:   {nodes: [{id, val, next: id|null}], pointers: {name: id|null}}
  tree:         {root: id|null, nodes: [{id, val, left: id|null, right: id|null}],
                 pointers: {name: id|null}, groups: {name: [id, ...]}}
  grid:         {rows: [[cell, ...]], cells: {name: [r, c]|null}, marked: [[r, c], ...],
                 row_labels: [..]|null, col_labels: [..]|null}
  intervals:    {lanes: {name: [[start, end], ...]}, pointers: {name: index|null}}
  callstack:    {frames: [{fn, args: {name: brief value}}]}
  graph:        {nodes: [{id, x, y}], edges: [{from, to, w, directed}],
                 highlight: {nodes: [id], edges: ["from>to"]}, labels: {id: text}}
                 (the var holds that dict; used by lesson figures, rarely by traces)
Node ids (linkedlist, tree) are stable for the whole trace so the studio can animate in place.
"""

from __future__ import annotations

import inspect
import json
import math
import re
import sys
from collections.abc import Callable
from pathlib import Path
from types import CodeType, FrameType
from typing import Any

TRACE_VERSION = 1
MAX_STEPS = 400
MAX_LIST_NODES = 64
MAX_TREE_NODES = 63
VIEW_TYPES = {"array", "map", "vars", "linkedlist", "tree", "heap", "grid", "intervals", "callstack", "graph"}
_NEEDS_VAR = {"array", "map", "linkedlist", "tree", "heap", "grid", "graph"}
_NOTE_RE = re.compile(r"\s*#\s*note:\s*(.+?)\s*$")


class TraceError(Exception):
    pass


def _set_order(x: object) -> tuple[int, float, str]:
    """Numbers in numeric order (so 1, 2, 3, 100 reads as a run), everything else by repr after them."""
    if isinstance(x, (int, float)) and not isinstance(x, bool):
        return (0, float(x), "")
    return (1, 0.0, repr(x))


def _finite(value: Any) -> Any:
    """Replace inf/nan (invalid JSON for browsers) with readable strings."""
    if isinstance(value, float) and not math.isfinite(value):
        return "-∞" if value < 0 else "∞" if value > 0 else "NaN"
    if isinstance(value, dict):
        return {k: _finite(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_finite(v) for v in value]
    return value


def _jsonable(value: Any) -> Any:
    return _finite(json.loads(json.dumps(value, default=str)))


def _view_id(item: dict[str, Any]) -> str:
    return str(item.get("id") or item.get("var") or item["type"])


def validate_view(view: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(view, list) or not view:
        return ["view must be a non-empty list"]
    ids: set[str] = set()
    for i, item in enumerate(view):
        if not isinstance(item, dict) or item.get("type") not in VIEW_TYPES:
            errors.append(f"view[{i}].type must be one of {sorted(VIEW_TYPES)}")
            continue
        kind = item["type"]
        if kind in _NEEDS_VAR and not isinstance(item.get("var"), str):
            errors.append(f"view[{i}] ({kind}) needs 'var'")
        if kind == "vars" and not isinstance(item.get("vars"), list):
            errors.append(f"view[{i}] (vars) needs a 'vars' list")
        if kind == "intervals" and (not isinstance(item.get("lanes"), dict) or not item["lanes"]):
            errors.append(f"view[{i}] (intervals) needs 'lanes': {{label: var}}")
        window = item.get("window")
        if window is not None and (not isinstance(window, list) or len(window) != 2):
            errors.append(f"view[{i}].window must be [lo_var, hi_var]")
        for label, pair in (item.get("cells") or {}).items():
            if not isinstance(pair, list) or len(pair) != 2:
                errors.append(f"view[{i}].cells.{label} must be [row_var, col_var]")
        vid = _view_id(item)
        if vid in ids:
            errors.append(f"view[{i}]: duplicate id {vid!r}")
        ids.add(vid)
    return errors


# ------------------------------------------------------------------ node helpers


class NodeRegistry:
    """Stable ids for nodes across the whole trace (first-seen order), so the studio can keep each
    node in place and animate only links and pointers. Holds references so ids are never reused."""

    def __init__(self) -> None:
        self._ids: dict[int, int] = {}
        self._alive: list[Any] = []

    def id_of(self, node: Any) -> int:
        key = id(node)
        if key not in self._ids:
            self._ids[key] = len(self._alive)
            self._alive.append(node)
        return self._ids[key]


def _is_node(value: Any) -> bool:
    return value is not None and hasattr(value, "val") and hasattr(value, "next")


def _is_tree_node(value: Any) -> bool:
    return value is not None and hasattr(value, "val") and hasattr(value, "left") and hasattr(value, "right")


def _linked_list_state(item: dict[str, Any], local_vars: dict[str, Any], registry: NodeRegistry) -> dict[str, Any]:
    """Nodes reachable from `var` and from every pointer variable.

    nodes: [{id, val, next: id | null}] sorted by stable id; pointers: {label: id | null}.
    A `next` pointing to a lower id is a reversed link or a cycle.
    """
    seen: dict[int, Any] = {}

    def walk(node: Any) -> None:
        while _is_node(node) and id(node) not in seen and len(seen) < MAX_LIST_NODES:
            seen[id(node)] = node
            registry.id_of(node)
            node = node.next

    walk(local_vars.get(item["var"]))
    pointer_vars = item.get("pointers") or {}
    for var in pointer_vars.values():
        walk(local_vars.get(var))
    nodes = sorted(
        (
            {
                "id": registry.id_of(n),
                "val": n.val,
                "next": registry.id_of(n.next) if _is_node(n.next) and id(n.next) in seen else None,
            }
            for n in seen.values()
        ),
        key=lambda d: d["id"],
    )
    pointers = {}
    for label, var in pointer_vars.items():
        value = local_vars.get(var)
        pointers[label] = registry.id_of(value) if _is_node(value) and id(value) in seen else None
    return {"nodes": nodes, "pointers": pointers}


def _iter_nodes(value: Any) -> list[Any]:
    """A node, or any iterable of nodes / (node, extra) tuples (queues, stacks, paths, sets)."""
    if _is_tree_node(value):
        return [value]
    out = []
    if isinstance(value, (list, tuple, set, frozenset)) or hasattr(value, "__iter__") and not isinstance(value, str):
        try:
            items = list(value)
        except TypeError:
            return []
        for v in items:
            if _is_tree_node(v):
                out.append(v)
            elif isinstance(v, tuple) and v and _is_tree_node(v[0]):
                out.append(v[0])
    return out


def _tree_state(item: dict[str, Any], local_vars: dict[str, Any], registry: NodeRegistry) -> dict[str, Any]:
    root = local_vars.get(item["var"])
    seen: dict[int, Any] = {}
    queue = [root] if _is_tree_node(root) else []
    while queue and len(seen) < MAX_TREE_NODES:
        node = queue.pop(0)
        if id(node) in seen:
            continue
        seen[id(node)] = node
        registry.id_of(node)
        queue += [c for c in (node.left, node.right) if _is_tree_node(c)]

    def ref(node: Any) -> int | None:
        return registry.id_of(node) if _is_tree_node(node) and id(node) in seen else None

    nodes = sorted(
        ({"id": registry.id_of(n), "val": n.val, "left": ref(n.left), "right": ref(n.right)} for n in seen.values()),
        key=lambda d: d["id"],
    )
    pointers = {label: ref(local_vars.get(var)) for label, var in (item.get("pointers") or {}).items()}
    groups = {}
    for label, var in (item.get("groups") or {}).items():
        groups[label] = [i for i in (ref(n) for n in _iter_nodes(local_vars.get(var))) if i is not None]
    return {"root": ref(root), "nodes": nodes, "pointers": pointers, "groups": groups}


def _array_state(item: dict[str, Any], local_vars: dict[str, Any]) -> dict[str, Any]:
    raw = local_vars.get(item["var"])
    values = list(raw) if raw is not None else []
    pointers = {name: local_vars.get(var) for name, var in (item.get("pointers") or {}).items()}
    window = None
    if item.get("window"):
        lo, hi = (local_vars.get(v) for v in item["window"])
        window = [lo, hi] if isinstance(lo, int) and isinstance(hi, int) and lo <= hi else None
    return {"values": values, "pointers": pointers, "window": window}


def _cell(value: Any) -> list[int] | None:
    if isinstance(value, (list, tuple)) and len(value) == 2 and all(isinstance(v, int) for v in value):
        return [value[0], value[1]]
    return None


def _grid_state(item: dict[str, Any], local_vars: dict[str, Any]) -> dict[str, Any]:
    raw = local_vars.get(item["var"]) or []
    rows = [list(r) for r in raw]
    cells = {}
    for label, (rv, cv) in (item.get("cells") or {}).items():
        r, c = local_vars.get(rv), local_vars.get(cv)
        cells[label] = [r, c] if isinstance(r, int) and isinstance(c, int) else None
    marked: list[list[int]] = []
    mark_var = item.get("marked")
    if mark_var:
        raw_marks = local_vars.get(mark_var)
        if isinstance(raw_marks, dict):
            raw_marks = list(raw_marks)
        for m in sorted(raw_marks or [], key=repr) if not isinstance(raw_marks, list) else raw_marks or []:
            cell = _cell(m)
            if cell:
                marked.append(cell)

    def labels(key: str) -> list[Any] | None:
        var = item.get(key)
        value = local_vars.get(var) if var else None
        return list(value) if value is not None else None

    return {
        "rows": rows,
        "cells": cells,
        "marked": marked,
        "row_labels": labels("row_labels"),
        "col_labels": labels("col_labels"),
    }


def _intervals_state(item: dict[str, Any], local_vars: dict[str, Any]) -> dict[str, Any]:
    lanes = {}
    for label, var in item["lanes"].items():
        raw = local_vars.get(var) or []
        lanes[label] = [list(iv)[:2] for iv in raw if isinstance(iv, (list, tuple)) and len(iv) >= 2]
    pointers = {name: local_vars.get(var) for name, var in (item.get("pointers") or {}).items()}
    return {"lanes": lanes, "pointers": pointers}


def _graph_state(item: dict[str, Any], local_vars: dict[str, Any]) -> dict[str, Any]:
    """A drawn graph: the var holds {nodes, edges, highlight?, labels?}; missing parts default to empty."""
    raw = local_vars.get(item["var"])
    raw = raw if isinstance(raw, dict) else {}
    highlight = raw.get("highlight") if isinstance(raw.get("highlight"), dict) else {}
    nodes = [{"id": str(n["id"]), "x": n["x"], "y": n["y"]} for n in raw.get("nodes") or []]
    edges = [
        {
            "from": str(e["from"]),
            "to": str(e["to"]),
            "w": e.get("w"),
            "directed": bool(e.get("directed", False)),
        }
        for e in raw.get("edges") or []
    ]
    return {
        "nodes": nodes,
        "edges": edges,
        "highlight": {
            "nodes": [str(n) for n in highlight.get("nodes") or []],
            "edges": [str(e) for e in highlight.get("edges") or []],
        },
        "labels": {str(k): str(v) for k, v in (raw.get("labels") or {}).items()},
    }


def _brief(value: Any) -> Any:
    """Compact, JSON-safe rendering of an argument for the call-stack view."""
    if _is_tree_node(value) or _is_node(value):
        return f"node({value.val})"
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        return value if len(value) <= 24 else value[:21] + "..."
    text = (
        json.dumps(_jsonable(value), ensure_ascii=False) if isinstance(value, (list, tuple, dict, set)) else repr(value)
    )
    return text if len(text) <= 32 else text[:29] + "..."


def snapshot(
    view: list[dict[str, Any]],
    local_vars: dict[str, Any],
    registry: NodeRegistry | None = None,
    frames: list[FrameType] | None = None,
) -> dict[str, Any]:
    """Extract the watched state from a frame's locals (plus the active traced frames)."""
    registry = registry or NodeRegistry()
    state: dict[str, Any] = {}
    for item in view:
        kind, vid = item["type"], _view_id(item)
        if kind in {"array", "heap"}:
            state[vid] = _array_state(item, local_vars)
        elif kind == "map":
            raw = local_vars.get(item["var"])
            if isinstance(raw, dict):
                entries = [[k, v] for k, v in raw.items()]
            elif isinstance(raw, (set, frozenset)):
                entries = [[k, None] for k in sorted(raw, key=_set_order)]
            else:
                entries = []
            state[vid] = {"entries": entries}
        elif kind == "linkedlist":
            state[vid] = _linked_list_state(item, local_vars, registry)
        elif kind == "tree":
            state[vid] = _tree_state(item, local_vars, registry)
        elif kind == "grid":
            state[vid] = _grid_state(item, local_vars)
        elif kind == "intervals":
            state[vid] = _intervals_state(item, local_vars)
        elif kind == "graph":
            state[vid] = _graph_state(item, local_vars)
        elif kind == "callstack":
            out = []
            for f in frames or []:
                names = f.f_code.co_varnames[: f.f_code.co_argcount]
                args = {n: _brief(f.f_locals.get(n)) for n in names if n not in {"self"}}
                out.append({"fn": f.f_code.co_name, "args": args})
            state[vid] = {"frames": out}
        else:  # vars
            state[vid] = {"values": {name: local_vars.get(name) for name in item["vars"]}}
    return _jsonable(state)


# ------------------------------------------------------------------ capture


def _source(fn: Callable[..., Any]) -> tuple[list[str], int, dict[int, str]]:
    """(display lines without note comments, first line number, {relative line: note})."""
    lines, start = inspect.getsourcelines(fn)
    display, notes = [], {}
    for i, raw in enumerate(lines, start=1):
        line = raw.rstrip("\n")
        match = _NOTE_RE.search(line)
        if match:
            notes[i] = match.group(1)
            line = line[: match.start()].rstrip()
        display.append(line)
    return display, start, notes


def _code_objects(code: CodeType) -> set[CodeType]:
    """The function's code plus every code object nested inside it (inner helpers, lambdas...)."""
    out = {code}
    for const in code.co_consts:
        if isinstance(const, CodeType):
            out |= _code_objects(const)
    return out


def capture(
    fn: Callable[..., Any],
    inputs: dict[str, Any],
    view: list[dict[str, Any]],
    title: str = "",
    max_steps: int = MAX_STEPS,
    display_input: dict[str, Any] | None = None,
    result_to_json: Callable[[Any], Any] | None = None,
) -> dict[str, Any]:
    """Run ``fn(**inputs)`` under the tracer.

    ``display_input`` is the JSON shown as the input (when ``inputs`` holds converted objects such
    as ListNode); ``result_to_json`` converts the return value (e.g. a ListNode back to a list).
    """
    errors = validate_view(view)
    if errors:
        raise TraceError("; ".join(errors))
    code, start, notes = _source(fn)
    codes = _code_objects(fn.__code__)
    steps: list[dict[str, Any]] = []
    stack: list[FrameType] = []  # active traced frames, outermost first
    prev_line: dict[int, int | None] = {}  # id(frame) -> line it is about to finish
    last_state: list[Any] = [None]
    registry = NodeRegistry()

    def emit(abs_line: int, frame: FrameType, final: bool = False) -> None:
        rel = abs_line - start + 1
        merged = {**stack[0].f_locals, **frame.f_locals} if stack else dict(frame.f_locals)
        state = snapshot(view, merged, registry, stack)
        note = notes.get(rel)
        if state == last_state[0] and note is None and not final and steps:
            return
        if len(steps) >= max_steps:
            raise TraceError(f"trace exceeds {max_steps} steps — use a smaller input")
        steps.append({"line": rel, "note": note, "state": state})
        last_state[0] = state

    def local(frame: FrameType, event: str, arg: Any) -> Any:
        key = id(frame)
        if event in {"line", "return"} and prev_line.get(key) is not None:
            emit(prev_line[key], frame, final=event == "return" and frame is stack[0])
        if event == "line":
            prev_line[key] = frame.f_lineno
        elif event == "return":
            prev_line.pop(key, None)
            if stack and stack[-1] is frame:
                stack.pop()
        return local

    def global_(frame: FrameType, event: str, arg: Any) -> Any:
        if event != "call" or frame.f_code not in codes:
            return None
        if not stack and frame.f_code is not fn.__code__:
            return None
        stack.append(frame)
        prev_line[id(frame)] = None
        return local

    old = sys.gettrace()
    sys.settrace(global_)
    try:
        result = fn(**inputs)
    finally:
        sys.settrace(old)
    return {
        "version": TRACE_VERSION,
        "title": title,
        "code": code,
        "view": view,
        "input": _jsonable(display_input if display_input is not None else inputs),
        "steps": steps,
        "result": _jsonable(result_to_json(result) if result_to_json else result),
    }


def load_function(source: Path, name: str) -> Callable[..., Any]:
    from kb.pyexec import load_module  # local import: pyexec imports signal handlers lazily

    module = load_module(source)
    fn = getattr(module, name, None)
    if not callable(fn):
        raise TraceError(f"{source.name} has no function {name!r}")
    return fn
