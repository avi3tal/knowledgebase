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
  maze:         {walls: ["#o.", ...], start: [r, c]|null, goal: [r, c]|null, current: [r, c]|null,
                 visited: [[r, c], ...], frontier: [[r, c], ...] (queue/stack order),
                 path: [[r, c], ...]|null, group: int|null}  (a grid search drawn as a place:
                 "#" wall / water, "o" rubble (passable at a cost), "." floor / land; `path` is the
                 cheapest route, computed by kb, once `current` reaches the goal; `group` is the
                 spec's group var, e.g. the island number; with a `parent` var (cell -> previous
                 cell) the route is the one the algorithm found, e.g. DFS's)
  roadmap:      {nodes: [{id, name, x, y}], roads: [{a, b, w}], start, goal, current: id|null,
                 dist: {id: d}, frontier: [id, ...] (heap order), relax: [from, to]|null,
                 route: [id, ...]|null}  (a weighted graph drawn as a city map; ids are strings;
                 the spec's `layout` {id: [x, y]} places intersections, `places` names them)
Node ids (linkedlist, tree) are stable for the whole trace so the studio can animate in place.
"""

from __future__ import annotations

import heapq
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
VIEW_TYPES = {
    "array",
    "map",
    "vars",
    "linkedlist",
    "tree",
    "heap",
    "grid",
    "intervals",
    "callstack",
    "graph",
    "maze",
    "roadmap",
}
_NEEDS_VAR = {"array", "map", "linkedlist", "tree", "heap", "grid", "graph", "maze", "roadmap"}
MAZE_MOVES = ((1, 0), (-1, 0), (0, 1), (0, -1))
MAZE_THEMES = {"maze", "terrain"}
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
        if kind == "maze":
            errors += [f"view[{i}] (maze): {e}" for e in _validate_maze(item)]
        if kind == "roadmap":
            errors += [f"view[{i}] (roadmap): {e}" for e in _validate_roadmap(item)]
        for label, pair in (item.get("cells") or {}).items():
            if not isinstance(pair, list) or len(pair) != 2:
                errors.append(f"view[{i}].cells.{label} must be [row_var, col_var]")
        vid = _view_id(item)
        if vid in ids:
            errors.append(f"view[{i}]: duplicate id {vid!r}")
        ids.add(vid)
    return errors


def _validate_maze(item: dict[str, Any]) -> list[str]:
    errors = []
    for key in ("wall", "rubble"):
        v = item.get(key)
        if v is not None and not (isinstance(v, int) or (isinstance(v, str) and len(v) == 1)):
            errors.append(f"{key} must be one character or an int")
    if item.get("theme", "maze") not in MAZE_THEMES:
        errors.append(f"theme must be one of {sorted(MAZE_THEMES)}")
    for key in ("start", "goal"):
        pair = item.get(key)
        if pair is not None and not (isinstance(pair, list) and len(pair) == 2 and all(type(v) is int for v in pair)):
            errors.append(f"{key} must be [row, col] ints (negative counts from the end)")
    current = item.get("current")
    if current is not None and not (
        isinstance(current, list) and len(current) == 2 and all(isinstance(v, str) for v in current)
    ):
        errors.append("current must be [row_var, col_var]")
    for key in ("visited", "frontier", "group", "parent"):
        if item.get(key) is not None and not isinstance(item[key], str):
            errors.append(f"{key} must be a variable name")
    return errors


def _validate_roadmap(item: dict[str, Any]) -> list[str]:
    errors = []
    layout = item.get("layout")
    if not isinstance(layout, dict) or not layout:
        errors.append("layout must map every node id to [x, y]")
    elif not all(isinstance(v, list) and len(v) == 2 and all(_numeric(x) for x in v) for v in layout.values()):
        errors.append("layout values must be [x, y] numbers")
    if item.get("places") is not None and not isinstance(item["places"], dict):
        errors.append("places must map node id to a name")
    for key in ("current", "dist", "frontier", "prev", "start", "goal"):
        if item.get(key) is not None and not isinstance(item[key], str):
            errors.append(f"{key} must be a variable name")
    relax = item.get("relax")
    if relax is not None and not (
        isinstance(relax, list) and len(relax) == 2 and all(isinstance(v, str) for v in relax)
    ):
        errors.append("relax must be [from_var, to_var]")
    return errors


def _numeric(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


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


def _cells(value: Any) -> list[list[int]]:
    """Cells of a queue / stack / set / dict: items are (r, c) or start with r, c (e.g. (r, c, dist))."""
    if value is None:
        return []
    items = sorted(value, key=repr) if isinstance(value, (set, frozenset, dict)) else list(value)
    out = []
    for item in items:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            cell = _cell(list(item[:2]))
            if cell:
                out.append(cell)
    return out


def _resolve(pair: list[int] | None, rows: int, cols: int) -> list[int] | None:
    """[r, c] with negative indices counted from the end (goal [-1, -1] = bottom-right)."""
    if pair is None or rows == 0 or cols == 0:
        return None
    r, c = pair[0] % rows if pair[0] < 0 else pair[0], pair[1] % cols if pair[1] < 0 else pair[1]
    return [r, c] if 0 <= r < rows and 0 <= c < cols else None


def maze_path(walls: list[str], start: list[int], goal: list[int]) -> list[list[int]] | None:
    """The cheapest 4-way route from start to goal, or None: "#" is impassable, entering "o" (rubble)
    costs one removal, "." is free. Fewest removals first, then fewest steps (a plain maze = the
    shortest path). Ties break by MAZE_MOVES order, so the route is deterministic."""
    rows, cols = len(walls), len(walls[0]) if walls else 0
    first = (start[0], start[1])
    best: dict[tuple[int, int], tuple[int, int]] = {first: (0, 0)}
    parent: dict[tuple[int, int], tuple[int, int] | None] = {first: None}
    heap = [(0, 0, 0, first)]
    tick = 0
    while heap:
        cost, steps, _, cell = heapq.heappop(heap)
        if [cell[0], cell[1]] == goal:
            return _route(parent, cell)
        if (cost, steps) > best[cell]:
            continue
        for dr, dc in MAZE_MOVES:
            nxt = (cell[0] + dr, cell[1] + dc)
            if not (0 <= nxt[0] < rows and 0 <= nxt[1] < cols) or walls[nxt[0]][nxt[1]] == "#":
                continue
            key = (cost + (walls[nxt[0]][nxt[1]] == "o"), steps + 1)
            if nxt not in best or key < best[nxt]:
                best[nxt], parent[nxt], tick = key, cell, tick + 1
                heapq.heappush(heap, (*key, tick, nxt))
    return None


def _route(parent: dict[tuple[int, int], tuple[int, int] | None], end: tuple[int, int]) -> list[list[int]]:
    route = [end]
    while (prev := parent[route[-1]]) is not None:
        route.append(prev)
    return [list(cell) for cell in reversed(route)]


def _maze_row(row: Any, wall: Any, rubble: Any) -> str:
    """One grid row as "#" (wall), "o" (rubble: passable at a cost) and "." (floor)."""
    return "".join("#" if _is(ch, wall) else "o" if _is(ch, rubble) else "." for ch in row)


def _is(cell: Any, marker: Any) -> bool:
    """A grid cell equals a spec marker, whether the grid holds "1" or 1."""
    return marker is not None and (cell == marker or str(cell) == str(marker))


def _found_path(
    item: dict[str, Any], local_vars: dict[str, Any], walls: list[str], start: Any, goal: list[int]
) -> list[list[int]] | None:
    """The route to draw on reaching the goal: the algorithm's own (walking its `parent` var back
    from the goal) when the spec names one, else kb's cheapest route."""
    if not item.get("parent"):
        return maze_path(walls, start, goal)
    parent = local_vars.get(item["parent"])
    if not isinstance(parent, dict):
        return None
    route, cell, guard = [], (goal[0], goal[1]), len(parent) + 1
    while cell is not None and guard > 0:
        route.append([cell[0], cell[1]])
        cell, guard = parent.get(cell), guard - 1
    return list(reversed(route)) if route[-1] == start else None


def _maze_state(item: dict[str, Any], local_vars: dict[str, Any]) -> dict[str, Any]:
    wall, rubble = item.get("wall", "#"), item.get("rubble")
    walls = [_maze_row(row, wall, rubble) for row in local_vars.get(item["var"]) or []]
    rows, cols = len(walls), len(walls[0]) if walls else 0
    start = _resolve(item.get("start"), rows, cols)
    goal = _resolve(item.get("goal"), rows, cols)
    current = _cell([local_vars.get(v) for v in item["current"]]) if item.get("current") else None
    reached = start is not None and goal is not None and current == goal
    group = local_vars.get(item["group"]) if item.get("group") else None
    return {
        "walls": walls,
        "start": start,
        "goal": goal,
        "current": current,
        "visited": _cells(local_vars.get(item["visited"])) if item.get("visited") else [],
        "frontier": _cells(local_vars.get(item["frontier"])) if item.get("frontier") else [],
        "path": _found_path(item, local_vars, walls, start, goal) if reached else None,
        "group": group if isinstance(group, int) and not isinstance(group, bool) else None,
    }


def _node(value: Any) -> str | None:
    """A node id as the map's string key: ints / strs as-is, heap entries (dist, node) by their node."""
    if isinstance(value, (list, tuple)) and value:
        value = value[-1]
    if value is None or isinstance(value, bool) or not isinstance(value, (int, str)):
        return None
    return str(value)


def _road_route(prev: Any, start: str | None, goal: str | None) -> list[str] | None:
    """Walk `prev` (node -> previous node) back from the goal to the start."""
    if not isinstance(prev, dict) or start is None or goal is None:
        return None
    links = {str(k): _node(v) for k, v in prev.items()}
    route, guard = [goal], len(links) + 1
    while route[-1] != start and route[-1] in links and guard > 0:
        route.append(links[route[-1]])  # type: ignore[arg-type]
        guard -= 1
    return list(reversed(route)) if route[-1] == start else None


def _roadmap_state(item: dict[str, Any], local_vars: dict[str, Any]) -> dict[str, Any]:
    """A weighted graph as a city map: `var` holds roads [[a, b, w], ...]; the spec's `layout` places
    the intersections. `route` (start -> goal via `prev`) appears once `current` is the goal."""
    get = lambda key: local_vars.get(item[key]) if item.get(key) else None  # noqa: E731
    places = item.get("places") or {}
    nodes = [{"id": str(k), "name": str(places.get(k, k)), "x": v[0], "y": v[1]} for k, v in item["layout"].items()]
    roads = [
        {"a": str(r[0]), "b": str(r[1]), "w": r[2] if len(r) > 2 else None}
        for r in get("var") or []
        if isinstance(r, (list, tuple)) and len(r) >= 2
    ]
    current, start, goal = _node(get("current")), _node(get("start")), _node(get("goal"))
    dist = get("dist")
    relax = [_node(local_vars.get(v)) for v in item["relax"]] if item.get("relax") else [None, None]
    return {
        "nodes": nodes,
        "roads": roads,
        "start": start,
        "goal": goal,
        "current": current,
        "dist": {str(k): v for k, v in dist.items()} if isinstance(dist, dict) else {},
        "frontier": [n for n in (_node(x) for x in get("frontier") or []) if n is not None],
        "relax": relax if None not in relax else None,
        "route": _road_route(get("prev"), start, goal) if current is not None and current == goal else None,
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
        elif kind == "maze":
            state[vid] = _maze_state(item, local_vars)
        elif kind == "roadmap":
            state[vid] = _roadmap_state(item, local_vars)
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
