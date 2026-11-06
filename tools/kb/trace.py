"""Deterministic step traces of a reference solution, for animated lessons.

The reference code stays clean: it is executed under ``sys.settrace`` and, after every executed
line, the variables named in a *view spec* are snapshotted. ``# note: ...`` comments on a line
become the narration shown when that line has just run (the comment is stripped from the code
shown to the learner). Only steps where watched state changes (or that carry a note) are kept.

Trace JSON (version 1) is the contract with the studio (studio/src/trace.ts):
  {version, title, code: [lines], view: [...], input, steps: [{line, note, state}], result}
  array state: {values, pointers: {name: index|null}, window: [lo, hi] | null}
  map state:   {entries: [[key, value], ...]}        (sets: value is null)
  vars state:  {values: {name: value}}
  linkedlist:  {nodes: [{id, val, next: id|null}], pointers: {name: id|null}}  (ids stable per trace)
"""

from __future__ import annotations

import inspect
import json
import math
import re
import sys
from collections.abc import Callable
from pathlib import Path
from types import FrameType
from typing import Any

TRACE_VERSION = 1
MAX_STEPS = 400
VIEW_TYPES = {"array", "map", "vars", "linkedlist"}
MAX_LIST_NODES = 64
_NOTE_RE = re.compile(r"\s*#\s*note:\s*(.+?)\s*$")


class TraceError(Exception):
    pass


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
        if item["type"] in {"array", "map", "linkedlist"} and not isinstance(item.get("var"), str):
            errors.append(f"view[{i}] ({item['type']}) needs 'var'")
        if item["type"] == "vars" and not isinstance(item.get("vars"), list):
            errors.append(f"view[{i}] (vars) needs a 'vars' list")
        window = item.get("window")
        if window is not None and (not isinstance(window, list) or len(window) != 2):
            errors.append(f"view[{i}].window must be [lo_var, hi_var]")
        vid = _view_id(item)
        if vid in ids:
            errors.append(f"view[{i}]: duplicate id {vid!r}")
        ids.add(vid)
    return errors


def snapshot(
    view: list[dict[str, Any]], local_vars: dict[str, Any], registry: NodeRegistry | None = None
) -> dict[str, Any]:
    """Extract the watched state from a frame's locals."""
    registry = registry or NodeRegistry()
    state: dict[str, Any] = {}
    for item in view:
        kind, vid = item["type"], _view_id(item)
        if kind == "array":
            raw = local_vars.get(item["var"])
            values = list(raw) if raw is not None else []
            pointers = {name: local_vars.get(var) for name, var in (item.get("pointers") or {}).items()}
            window = None
            if item.get("window"):
                lo, hi = (local_vars.get(v) for v in item["window"])
                window = [lo, hi] if isinstance(lo, int) and isinstance(hi, int) and lo <= hi else None
            state[vid] = {"values": values, "pointers": pointers, "window": window}
        elif kind == "map":
            raw = local_vars.get(item["var"])
            if isinstance(raw, dict):
                entries = [[k, v] for k, v in raw.items()]
            elif isinstance(raw, (set, frozenset)):
                entries = [[k, None] for k in sorted(raw, key=repr)]
            else:
                entries = []
            state[vid] = {"entries": entries}
        elif kind == "linkedlist":
            state[vid] = _linked_list_state(item, local_vars, registry)
        else:  # vars
            state[vid] = {"values": {name: local_vars.get(name) for name in item["vars"]}}
    return _jsonable(state)


def _is_node(value: Any) -> bool:
    return value is not None and hasattr(value, "val") and hasattr(value, "next")


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
    target = fn.__code__
    steps: list[dict[str, Any]] = []
    root: list[FrameType] = []
    prev_line: list[int | None] = [None]
    last_state: list[Any] = [None]
    registry = NodeRegistry()

    def emit(abs_line: int, frame: FrameType, final: bool = False) -> None:
        rel = abs_line - start + 1
        state = snapshot(view, dict(frame.f_locals), registry)
        note = notes.get(rel)
        if state == last_state[0] and note is None and not final and steps:
            return
        if len(steps) >= max_steps:
            raise TraceError(f"trace exceeds {max_steps} steps — use a smaller input")
        steps.append({"line": rel, "note": note, "state": state})
        last_state[0] = state

    def local(frame: FrameType, event: str, arg: Any) -> Any:
        if frame is not root[0]:
            return None
        if event in {"line", "return"} and prev_line[0] is not None:
            emit(prev_line[0], frame, final=event == "return")
        prev_line[0] = frame.f_lineno if event == "line" else None
        return local

    def global_(frame: FrameType, event: str, arg: Any) -> Any:
        if event == "call" and frame.f_code is target and not root:
            root.append(frame)
            return local
        return None

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
