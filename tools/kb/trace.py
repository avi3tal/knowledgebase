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
VIEW_TYPES = {"array", "map", "vars"}
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
        if item["type"] in {"array", "map"} and not isinstance(item.get("var"), str):
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


def snapshot(view: list[dict[str, Any]], local_vars: dict[str, Any]) -> dict[str, Any]:
    """Extract the watched state from a frame's locals."""
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
        else:  # vars
            state[vid] = {"values": {name: local_vars.get(name) for name in item["vars"]}}
    return _jsonable(state)


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
) -> dict[str, Any]:
    errors = validate_view(view)
    if errors:
        raise TraceError("; ".join(errors))
    code, start, notes = _source(fn)
    target = fn.__code__
    steps: list[dict[str, Any]] = []
    root: list[FrameType] = []
    prev_line: list[int | None] = [None]
    last_state: list[Any] = [None]

    def emit(abs_line: int, frame: FrameType, final: bool = False) -> None:
        rel = abs_line - start + 1
        state = snapshot(view, dict(frame.f_locals))
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
        "input": _jsonable(inputs),
        "steps": steps,
        "result": _jsonable(result),
    }


def load_function(source: Path, name: str) -> Callable[..., Any]:
    from kb.pyexec import load_module  # local import: pyexec imports signal handlers lazily

    module = load_module(source)
    fn = getattr(module, name, None)
    if not callable(fn):
        raise TraceError(f"{source.name} has no function {name!r}")
    return fn
