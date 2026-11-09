"""Lesson figures: real diagrams embedded in lesson markdown instead of ASCII sketches.

A markdown file embeds a figure with a fenced block whose body is the figure's name:

    ```figure
    placement
    ```

and the spec lives in `<lesson>/figures/<name>.json`. `kb learn validate` checks every spec; the
studio API inlines the specs next to the markdown (`figures: {name: spec}`) and the studio renders
them (DiagramCanvas for architecture, its own SVG for sequence, flowchart and uml, the trace views
for structure). Kinds:

- architecture: `nodes [{id, kind, label, sub?, x, y}]`, `edges [{from, to, label?}]` — the design
  console's shapes (`kind` from the system-design / ood palette; `sub` replaces the shape name under
  the label), plus optional numbered `steps`.
- sequence: `actors [{id, label, kind?}]`, `messages [{from, to, label, style?, note?}]`; every
  message is a numbered step (`style`: call | reply | error | async | self).
- flowchart: `nodes [{id, type, label, col, row, tone?}]` (`type`: start | step | decision | end;
  `tone`: good | bad colours an outcome),
  `edges [{from, to, label?}]` (label decision branches "yes" / "no"), optional `steps`.
- uml (class diagram): `classes [{id, name, stereotype?, fields?, methods?, x, y}]` and
  `relations [{from, to, type, label?, from_mult?, to_mult?, navigable?}]`. `x`/`y` are the box's
  top-left corner (boxes size themselves to the longest line). `stereotype`: interface | abstract |
  enum. Members are strings with the UML visibility prefix (`"+ add(p: Product): None"`,
  `"- _lines: dict[str, Line]"`, `"# _hook()"`); enum values are plain (`"SMALL"`). Relation `type`:
    inherits / implements      `from` is the subclass, `to` the parent (hollow triangle at `to`;
                               implements is dashed);
    composition / aggregation  `from` is the whole (filled / hollow diamond at `from`), `to` the part;
    association                a plain line (`navigable: true` adds an open arrow at `to`);
    dependency                 dashed line, open arrow at `to` (`from` uses `to`).
  `from_mult` / `to_mult` print near each end ("1", "0..1", "*", "1..*"); `label` mid-line.
  Steps highlight classes by id (`nodes`) and relations as `"from>to"` (`edges`), like architecture.
- structure (data-structure stills for algo lessons, drawn with the trace views): `views` (trace
  view specs: array, map, vars, linkedlist, tree, heap, grid, intervals, graph; see kb/trace.py),
  optional `types {var: "TreeNode" | "ListNode"}` (implied by tree / linkedlist views) and
  `frames [{text, vars: {name: JSON value}}]`. Every frame is a narrated step; vars carry over
  from the previous frame (set one to null to clear it). Values are plain JSON: trees are
  level-order lists with null, linked lists are lists, a `map` var is an object (or a list = a
  set), a `graph` var is `{nodes: [{id, x, y}], edges: [{from, to, w?, directed?}],
  highlight?: {nodes, edges: ["a>b"]}, labels?: {id: text}}`. Pointer vars are ints: an index into
  the array (array / heap / intervals), into the level-order list (tree; must be a non-null slot)
  or into the list (linkedlist); null = pointing nowhere. `load_all` turns frames into
  `frames [{text, state: {view_id: ViewState}}]` with the tracer's own snapshot code, so the
  studio draws them exactly like a trace step.

Every kind takes `title` and optional `caption`. `steps [{text, nodes?, edges?, fail?}]` highlight nodes
and edges (`"from>to"`) one step at a time with narration underneath; `fail` marks nodes/edges that
break in that step (red, ✕). Sequence `style: lost` is a message that never arrives.

`scenarios [{name, tone, summary?, steps?, caption?, <picture fields>}]` are tabs that
replay the figure for a failure, edge case, alternative design, risk or scaling stage (`tone`:
happy | failure | edge | alternative | risk | scale). A scenario's fields replace the base
figure's; the merged figure must be valid on its own. The base figure is the first tab
(`base_name`, default "How it works").

ASCII diagrams in code fences are not allowed in lessons: draw them as figures.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from kb import trace
from kb.convert import to_py

FENCE_RE = re.compile(r"^```figure[ \t]*\n([^\n`]*)\n```", re.M)
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
KINDS = {"architecture", "sequence", "flowchart", "uml", "structure"}
FLOW_TYPES = {"start", "step", "decision", "end"}
MESSAGE_STYLES = {"call", "reply", "error", "async", "self", "lost"}
SCENARIO_TONES = {"happy", "failure", "edge", "alternative", "risk", "scale"}
PICTURE_FIELDS = ("nodes", "edges", "actors", "messages", "classes", "relations", "views", "types", "frames")
SCENARIO_FIELDS = {"name", "tone", "summary", "steps", "caption", *PICTURE_FIELDS}
UML_STEREOTYPES = {"interface", "abstract", "enum"}
UML_RELATIONS = {"inherits", "implements", "composition", "aggregation", "association", "dependency"}
NODE_TYPES = {"tree": "TreeNode", "linkedlist": "ListNode"}
STRUCTURE_VIEWS = trace.VIEW_TYPES - {"callstack"}
_BAD_SPEC = (ValueError, TypeError, KeyError, AttributeError)


def names(markdown: str) -> list[str]:
    """Figure names a markdown file embeds, in order."""
    return [m.group(1).strip() for m in FENCE_RE.finditer(markdown)]


def path(ldir: Path, name: str) -> Path:
    return ldir / "figures" / f"{name}.json"


def load_all(ldir: Path, markdown: str) -> dict[str, Any]:
    """name -> spec for every figure the markdown embeds, as the studio draws it (structure frames
    normalised). Missing or broken specs are left out; validate reports them."""
    out: dict[str, Any] = {}
    for name in names(markdown):
        p = path(ldir, name)
        if NAME_RE.match(name) and p.is_file():
            try:
                spec = json.loads(p.read_text())
                out[name] = normalise(spec) if isinstance(spec, dict) and spec.get("kind") == "structure" else spec
            except _BAD_SPEC:
                continue
    return out


def normalise(spec: dict[str, Any]) -> dict[str, Any]:
    """A structure figure as the studio draws it: each frame's vars become trace view states (also in
    scenarios that change views, types or frames). Raises ValueError on an invalid spec."""
    errors: list[str] = []
    out = {k: v for k, v in spec.items() if k not in {"types", "scenarios"}}
    out["frames"] = _structure_frames(spec, errors)
    scenarios = []
    for sc in spec.get("scenarios") or []:
        sc = dict(sc)
        if any(k in sc for k in ("views", "types", "frames")):
            merged = {**spec, **sc}
            sc["views"], sc["frames"] = merged["views"], _structure_frames(merged, errors)
            sc.pop("types", None)
        scenarios.append(sc)
    if errors:
        raise ValueError("; ".join(errors))
    if scenarios:
        out["scenarios"] = scenarios
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
    one = what.removesuffix("es") if what.endswith("sses") else what[:-1]
    ids = [x.get("id") for x in items if isinstance(x, dict)]
    if len(ids) != len(items) or not all(isinstance(i, str) and i for i in ids):
        errors.append(f"every {one} needs an 'id'")
    if len(set(ids)) != len(ids):
        errors.append(f"duplicate {one} ids")
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
        bad += [x for x in s.get("fail", []) if x not in node_ids and x not in edge_keys]
        if bad:
            errors.append(f"step {i} highlights unknown nodes/edges {bad}")
        if not s.get("nodes") and not s.get("edges") and not s.get("fail"):
            errors.append(f"step {i} highlights nothing")


def validate(spec: Any, palette: set[str]) -> list[str]:
    """Problems with one figure spec (and each of its scenarios merged over it)."""
    if not isinstance(spec, dict):
        return ["spec must be an object"]
    errors = _validate_one(spec, palette)
    scenarios = spec.get("scenarios", [])
    if not isinstance(scenarios, list):
        return [*errors, "'scenarios' must be a list"]
    names = {str(spec.get("base_name", "How it works"))}
    for i, sc in enumerate(scenarios, 1):
        where = f"scenario {i} ({sc.get('name') if isinstance(sc, dict) else '?'})"
        if not isinstance(sc, dict) or not str(sc.get("name", "")).strip():
            errors.append(f"scenario {i} needs a 'name'")
            continue
        if sc["name"] in names:
            errors.append(f"{where}: duplicate scenario name")
        names.add(sc["name"])
        if sc.get("tone", "edge") not in SCENARIO_TONES:
            errors.append(f"{where}: tone must be one of {sorted(SCENARIO_TONES)}")
        if unknown := set(sc) - SCENARIO_FIELDS:
            errors.append(f"{where}: unknown fields {sorted(unknown)}")
        if not any(k in sc for k in ("steps", *PICTURE_FIELDS)):
            errors.append(f"{where}: changes nothing (give it steps or a changed picture)")
        merged = {**spec, **{k: v for k, v in sc.items() if k not in {"name", "tone", "summary"}}}
        merged.pop("scenarios", None)
        errors += [f"{where}: {e}" for e in _validate_one(merged, palette)]
    return errors


def _validate_one(spec: dict[str, Any], palette: set[str]) -> list[str]:
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
    elif kind == "uml":
        class_ids = _uml_classes(spec.get("classes"), errors)
        _steps(spec, class_ids, _uml_relations(spec.get("relations", []), class_ids, errors), errors)
    elif kind == "structure":
        if "steps" in spec:
            errors.append("structure figures narrate with 'frames', not 'steps'")
        _structure_frames(spec, errors)
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


# ------------------------------------------------------------------ uml


def _numeric(value: Any) -> bool:
    return isinstance(value, int | float) and not isinstance(value, bool)


def _uml_classes(classes: Any, errors: list[str]) -> set[str]:
    ids = _ids(classes, "classes", errors)
    for c in classes if isinstance(classes, list) else []:
        if not isinstance(c, dict):
            continue
        cid = c.get("id")
        if not isinstance(c.get("name"), str) or not c["name"].strip():
            errors.append(f"class {cid!r} needs a 'name'")
        if c.get("stereotype") is not None and c["stereotype"] not in UML_STEREOTYPES:
            errors.append(f"class {cid!r}: stereotype must be one of {sorted(UML_STEREOTYPES)}")
        for part in ("fields", "methods"):
            members = c.get(part, [])
            if not isinstance(members, list) or not all(isinstance(m, str) for m in members):
                errors.append(f"class {cid!r}: '{part}' must be a list of strings")
        if not (_numeric(c.get("x")) and _numeric(c.get("y"))):
            errors.append(f"class {cid!r} needs numeric x and y")
    return ids


def _uml_relations(relations: Any, class_ids: set[str], errors: list[str]) -> set[str]:
    if not isinstance(relations, list):
        errors.append("'relations' must be a list")
        return set()
    keys: set[str] = set()
    for r in relations:
        if not isinstance(r, dict) or r.get("from") not in class_ids or r.get("to") not in class_ids:
            errors.append(f"relation {r!r} must join two known classes")
            continue
        key = f"{r['from']}>{r['to']}"
        if r.get("type") not in UML_RELATIONS:
            errors.append(f"relation {key}: type must be one of {sorted(UML_RELATIONS)}")
        for k in ("label", "from_mult", "to_mult"):
            if k in r and not isinstance(r[k], str):
                errors.append(f"relation {key}: '{k}' must be a string")
        if "navigable" in r and not isinstance(r["navigable"], bool):
            errors.append(f"relation {key}: 'navigable' must be true or false")
        if key in keys:
            errors.append(f"relation {key} is drawn twice (one relation per pair and direction)")
        keys.add(key)
    return keys


# ------------------------------------------------------------------ structure


def _view_vars(item: dict[str, Any]) -> list[str]:
    """Vars a view cannot be drawn without."""
    if item["type"] == "vars":
        return list(item["vars"])
    if item["type"] == "intervals":
        return list(item["lanes"].values())
    return [item["var"]]


def _pointer(value: Any, slots: dict[int, Any], var: str, of: str) -> Any:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value not in slots:
        raise ValueError(f"pointer {var}={value!r} is not the index of a node of {of!r}")
    return slots[value]


def _tree_slots(values: list[Any], root: Any) -> dict[int, Any]:
    """Level-order index -> TreeNode, walking the tree in the order TreeNode.from_list consumes values."""
    slots: dict[int, Any] = {0: root} if root is not None else {}
    queue, i = ([root] if root is not None else []), 1
    while queue and i < len(values):
        node = queue.pop(0)
        for child in (node.left, node.right):
            if i < len(values) and values[i] is not None:
                slots[i] = child
                queue.append(child)
            i += 1
    return slots


def _hashable(x: Any) -> Any:
    return tuple(map(_hashable, x)) if isinstance(x, list) else x


def _check_graph(value: Any, var: str) -> None:
    if not isinstance(value, dict) or not isinstance(value.get("nodes"), list) or not value["nodes"]:
        raise ValueError(f"graph {var!r} needs a non-empty 'nodes' list")
    ids = set()
    for n in value["nodes"]:
        if not isinstance(n, dict) or not isinstance(n.get("id"), str | int):
            raise ValueError(f"graph {var!r}: every node needs an 'id'")
        if not (_numeric(n.get("x")) and _numeric(n.get("y"))):
            raise ValueError(f"graph {var!r}: node {n['id']!r} needs numeric x and y")
        ids.add(str(n["id"]))
    keys = set()
    for e in value.get("edges") or []:
        if not isinstance(e, dict) or str(e.get("from")) not in ids or str(e.get("to")) not in ids:
            raise ValueError(f"graph {var!r}: edge {e!r} must join two known nodes")
        keys |= {f"{e['from']}>{e['to']}", f"{e['to']}>{e['from']}"}
    hl = value.get("highlight") or {}
    bad = [n for n in hl.get("nodes") or [] if str(n) not in ids]
    bad += [e for e in hl.get("edges") or [] if e not in keys]
    if bad:
        raise ValueError(f"graph {var!r}: highlight names unknown nodes/edges {bad}")
    if unknown := set(map(str, value.get("labels") or {})) - ids:
        raise ValueError(f"graph {var!r}: labels for unknown nodes {sorted(unknown)}")


def _frame_locals(item: dict[str, Any], current: dict[str, Any]) -> dict[str, Any]:
    """A frame's plain vars as the tracer would see them for this view (real nodes for tree / list)."""
    local = dict(current)
    kind, var = item["type"], item.get("var")
    if kind == "map" and isinstance(current.get(var), list):
        local[var] = set(map(_hashable, current[var]))
    if kind == "graph":
        _check_graph(current.get(var), str(var))
    if kind not in NODE_TYPES:
        return local
    values = current.get(var)
    if values is not None and not isinstance(values, list):
        raise ValueError(f"{var!r} must be a list (level order for a tree) or null")
    root = to_py(NODE_TYPES[kind], values)
    if kind == "tree":
        slots = _tree_slots(values or [], root)
    else:
        slots, node = {}, root
        while node is not None:
            slots[len(slots)] = node
            node = node.next
    local[var] = root
    for pvar in (item.get("pointers") or {}).values():
        local[pvar] = _pointer(current.get(pvar), slots, pvar, var)
    for gvar in (item.get("groups") or {}).values():
        idx = current.get(gvar) or []
        if not isinstance(idx, list):
            raise ValueError(f"group {gvar!r} must be a list of node indexes")
        local[gvar] = [_pointer(i, slots, gvar, var) for i in idx]
    return local


def _structure_frames(spec: dict[str, Any], errors: list[str]) -> list[dict[str, Any]]:
    """Check a structure figure and turn its frames into trace view states (problems are appended)."""
    views = spec.get("views")
    view_errors = trace.validate_view(views)
    view_errors += [
        f"view {v.get('type')!r} cannot be drawn in a figure"
        for v in views or []
        if isinstance(v, dict) and v.get("type") in trace.VIEW_TYPES - STRUCTURE_VIEWS
    ]
    if view_errors:
        errors.extend(f"views: {e}" for e in view_errors)
        return []
    types = spec.get("types") or {}
    if not isinstance(types, dict) or any(t not in NODE_TYPES.values() for t in types.values()):
        errors.append(f"'types' must map vars to one of {sorted(NODE_TYPES.values())}")
        types = {}
    for v in views:
        if v.get("var") in types and types[v["var"]] != NODE_TYPES.get(v["type"]):
            errors.append(f"views: {v['var']!r} is typed {types[v['var']]} but drawn as {v['type']}")
    frames = spec.get("frames")
    if not isinstance(frames, list) or not frames:
        errors.append("needs a non-empty 'frames' list")
        return []
    out: list[dict[str, Any]] = []
    current: dict[str, Any] = {}
    for i, fr in enumerate(frames, 1):
        if not isinstance(fr, dict) or not isinstance(fr.get("text"), str) or not fr["text"].strip():
            errors.append(f"frame {i} needs 'text'")
            continue
        if not isinstance(fr.get("vars", {}), dict):
            errors.append(f"frame {i}: 'vars' must be an object")
            continue
        current = {**current, **fr.get("vars", {})}
        state: dict[str, Any] = {}
        for item in views:
            vid = trace._view_id(item)
            if missing := [v for v in _view_vars(item) if v not in current]:
                errors.append(f"frame {i}: view {vid!r} is missing vars {missing}")
                continue
            try:
                state.update(trace.snapshot([item], _frame_locals(item, current), trace.NodeRegistry()))
            except _BAD_SPEC as e:
                errors.append(f"frame {i}: view {vid!r}: {e}")
        out.append({"text": fr["text"], "state": state})
    return out
