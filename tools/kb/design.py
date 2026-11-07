"""Design problems (system design, OOD): files, deterministic rubric checks, smells, tips, diffs.

The format is specified in system-design/FORMAT.md. In short:

  <subject>/problems/<slug>/
    README.md      prompt + context (no solution)
    meta.json      {title, difficulty, kind: "design", topics: [catalog ids], sources, minutes}
    rubric.json    {version, flags, checks: [...], pattern}  (checks carry tips; served without spoilers)
    reference.md   reference walkthrough (spoiler: served only after you submit)
    reference/     a full reference attempt; `kb sd validate` requires it to pass every check

  <workspace>/attempts/<subject>/<slug>/<date>_design_<label>/
    design.json  estimates.json  diagrams/v1.json …  signatures.py  notes.md  [submitted.json]

Nothing here calls AI. Checks are keyword / structure based, so rubrics use generous keyword lists
and tips cover the gaps.
"""

from __future__ import annotations

import ast
import datetime as dt
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from kb import history
from kb.naming import SLUG_RE
from kb.paths import attempts_root, ensure_workspace, problems_dir
from kb.schema import DIFFICULTIES, ProblemError

VERSION = 1
DESIGN_SUBJECTS = ("system-design", "ood")
PALETTES: dict[str, list[str]] = {
    "system-design": [
        "client",
        "dns",
        "cdn",
        "load-balancer",
        "api-gateway",
        "service",
        "worker",
        "scheduler",
        "cache",
        "sql",
        "nosql",
        "blob",
        "search",
        "queue",
        "stream",
        "coordinator",
        "external",
    ],
    "ood": ["actor", "class", "abstract", "interface", "enum"],
}
STORE_KINDS = {"sql", "nosql", "blob", "search"}
ENTRY_KINDS = {"client", "actor"}
STAGES = ["scope", "estimates", "api", "high-level", "deep-dives", "wrap-up", "signatures"]
CHECK_STAGE = {
    "requirement": "scope",
    "estimate": "estimates",
    "endpoint": "api",
    "entity": "api",
    "component": "high-level",
    "edge": "high-level",
    "decision": "deep-dives",
    "wrapup": "wrap-up",
    "signature": "signatures",
}
WRAPUP_KEYS = ["bottlenecks", "failures", "monitoring", "scale", "future"]
TIP_LEVELS = ("nudge", "hint", "show")
SMELL_RULES = {
    "client-to-store": "A client talks to a data store directly: put a service in between.",
    "orphan-node": "A component has no connections.",
    "queue-no-consumer": "A queue/stream has no consumer (nothing reads from it).",
    "unreachable": "A component can't be reached from any client.",
    "single-store-read-heavy": "Read-heavy requirement, but one data store and no cache serve every read.",
    "no-load-balancer": "Clients hit services directly: no load balancer for horizontal scaling.",
    "orphan-class": "A class/interface has no relationships: is it part of the design?",
    "unimplemented-interface": "An interface/abstract type nothing implements or extends.",
}
FLAG_RULES = {"read_heavy": "single-store-read-heavy", "needs_lb": "no-load-balancer"}
MAX_VERSIONS = 20
MAX_TEXT = 4000
MAX_ROWS = 60
ATTEMPT_RE = re.compile(r"^\d{4}-\d{2}-\d{2}_design_[a-z0-9]+(-[a-z0-9]+)*$")
ID_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,40}$")

# units: (dimension, factor to the canonical unit of that dimension)
UNITS: dict[str, tuple[str, float]] = {
    "": ("count", 1),
    "count": ("count", 1),
    "/s": ("rate", 1),
    "qps": ("rate", 1),
    "rps": ("rate", 1),
    "/min": ("rate", 1 / 60),
    "/hour": ("rate", 1 / 3600),
    "/day": ("rate", 1 / 86400),
    "/month": ("rate", 1 / (30 * 86400)),
    "B": ("bytes", 1),
    "KB": ("bytes", 1e3),
    "MB": ("bytes", 1e6),
    "GB": ("bytes", 1e9),
    "TB": ("bytes", 1e12),
    "PB": ("bytes", 1e15),
    "B/s": ("bandwidth", 1),
    "KB/s": ("bandwidth", 1e3),
    "MB/s": ("bandwidth", 1e6),
    "GB/s": ("bandwidth", 1e9),
    "Gbps": ("bandwidth", 1e9 / 8),
    "ms": ("time", 1e-3),
    "s": ("time", 1),
    "servers": ("count", 1),
}
CONSTANTS = {"thousand": 1e3, "million": 1e6, "billion": 1e9, "day": 86400, "hour": 3600, "month": 30 * 86400}


# ------------------------------------------------------------------ problems


@dataclass
class DesignProblem:
    dir: Path
    meta: dict[str, Any]
    rubric: dict[str, Any]

    @property
    def slug(self) -> str:
        return self.dir.name

    @property
    def subject(self) -> str:
        return self.dir.parent.parent.name

    @property
    def attempts_dir(self) -> Path:
        return attempts_root(self.subject, self.slug)

    def attempts(self) -> list[Path]:
        if not self.attempts_dir.is_dir():
            return []
        return sorted(p for p in self.attempts_dir.iterdir() if p.is_dir() and ATTEMPT_RE.match(p.name))


def is_design_subject(subject: str) -> bool:
    return subject in DESIGN_SUBJECTS


def _json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except FileNotFoundError as e:
        raise ProblemError(f"missing {path.name} in {path.parent}") from e
    except json.JSONDecodeError as e:
        raise ProblemError(f"{path}: invalid JSON: {e}") from e


def load(subject: str, slug: str) -> DesignProblem:
    if not is_design_subject(subject) or not SLUG_RE.match(slug or ""):
        raise ProblemError(f"no design problem {subject}/{slug}")
    pdir = problems_dir(subject) / slug
    if not pdir.is_dir():
        raise ProblemError(f"no design problem {subject}/{slug}")
    meta = _json(pdir / "meta.json")
    # `patterns` mirrors `topics` so progress/feedback code shared with algo works unchanged.
    meta.setdefault("patterns", meta.get("topics", []))
    return DesignProblem(pdir, meta, _json(pdir / "rubric.json"))


def all_problems(subject: str) -> list[DesignProblem]:
    root = problems_dir(subject)
    out = []
    for d in sorted(p for p in root.iterdir() if p.is_dir()) if root.is_dir() else []:
        try:
            out.append(load(subject, d.name))
        except ProblemError:
            continue
    return out


# ------------------------------------------------------------------ estimates (safe arithmetic)


class EstimateError(ValueError):
    pass


_BINOPS = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Pow, ast.Mod)
MAX_MAGNITUDE = 1e30


def _eval(node: ast.AST, names: dict[str, float]) -> float:
    if isinstance(node, ast.Expression):
        return _eval(node.body, names)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
        return float(node.value)
    if isinstance(node, ast.Name):
        if node.id in names:
            return names[node.id]
        if node.id in CONSTANTS:
            return CONSTANTS[node.id]
        raise EstimateError(f"unknown name {node.id!r} (use an earlier row or {', '.join(CONSTANTS)})")
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
        v = _eval(node.operand, names)
        return v if isinstance(node.op, ast.UAdd) else -v
    if isinstance(node, ast.BinOp) and isinstance(node.op, _BINOPS):
        a, b = _eval(node.left, names), _eval(node.right, names)
        if isinstance(node.op, ast.Pow):
            if abs(b) > 64 or abs(a) > 1e15:
                raise EstimateError("exponent too large")
            v = a**b
        elif isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)):
            if b == 0:
                raise EstimateError("division by zero")
            v = a / b if isinstance(node.op, ast.Div) else (a // b if isinstance(node.op, ast.FloorDiv) else a % b)
        else:
            v = a + b if isinstance(node.op, ast.Add) else a - b if isinstance(node.op, ast.Sub) else a * b
        if isinstance(v, complex) or not math.isfinite(v) or abs(v) > MAX_MAGNITUDE:
            raise EstimateError("value out of range")
        return float(v)
    raise EstimateError("only numbers, earlier row names and + - * / // % ** ( ) are allowed")


def evaluate_estimates(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Evaluate rows top to bottom; each row may use the names of earlier rows."""
    names: dict[str, float] = {}
    out = []
    for row in rows[:MAX_ROWS]:
        name, formula, unit = str(row.get("name", "")), str(row.get("formula", "")), str(row.get("unit", ""))
        res: dict[str, Any] = {"name": name, "formula": formula, "unit": unit, "value": None, "error": None}
        try:
            if not re.match(r"^[A-Za-z_][A-Za-z0-9_]{0,40}$", name):
                raise EstimateError("name must be an identifier, e.g. write_qps")
            if unit not in UNITS:
                raise EstimateError(f"unknown unit {unit!r}")
            if not formula or len(formula) > 200:
                raise EstimateError("formula must be 1..200 chars")
            value = _eval(ast.parse(formula.replace("^", "**"), mode="eval"), names)
            names[name] = value
            res["value"] = value
        except (EstimateError, SyntaxError, RecursionError) as e:
            res["error"] = str(e) if not isinstance(e, SyntaxError) else "syntax error"
        out.append(res)
    return out


def convert(value: float, from_unit: str, to_unit: str) -> float | None:
    a, b = UNITS.get(from_unit), UNITS.get(to_unit)
    if a is None or b is None or a[0] != b[0]:
        return None
    return value * a[1] / b[1]


# ------------------------------------------------------------------ diagrams


def diagram_versions(attempt: Path) -> list[dict[str, Any]]:
    ddir = attempt / "diagrams"
    found = []
    for n in range(1, MAX_VERSIONS + 1):
        p = ddir / f"v{n}.json"
        if p.exists():
            try:
                found.append(json.loads(p.read_text()))
            except json.JSONDecodeError:
                found.append({"version": n, "nodes": [], "edges": [], "error": "invalid JSON"})
    return found


def validate_diagram(d: Any, subject: str) -> list[str]:
    if not isinstance(d, dict):
        return ["diagram must be an object"]
    e: list[str] = []
    if not isinstance(d.get("version"), int) or not 1 <= d["version"] <= MAX_VERSIONS:
        e.append(f"version must be 1..{MAX_VERSIONS}")
    nodes, edges = d.get("nodes", []), d.get("edges", [])
    if not isinstance(nodes, list) or not isinstance(edges, list):
        return e + ["nodes and edges must be lists"]
    ids = set()
    for i, n in enumerate(nodes):
        if not isinstance(n, dict) or not ID_RE.match(str(n.get("id", ""))):
            e.append(f"nodes[{i}].id must be a short identifier")
            continue
        if n["id"] in ids:
            e.append(f"duplicate node id {n['id']!r}")
        ids.add(n["id"])
        if n.get("kind") not in PALETTES[subject]:
            e.append(f"node {n['id']!r}: kind must be one of the {subject} palette")
        for k in ("x", "y"):
            if k in n and not isinstance(n[k], (int, float)):
                e.append(f"node {n['id']!r}: {k} must be a number")
    for i, ed in enumerate(edges):
        if not isinstance(ed, dict) or ed.get("from") not in ids or ed.get("to") not in ids:
            e.append(f"edges[{i}] must connect two existing nodes")
    if len(str(d.get("why", ""))) > MAX_TEXT:
        e.append("why is too long")
    return e


def _edge_key(e: dict[str, Any]) -> str:
    return f"{e['from']}->{e['to']}"


def diff(prev: dict[str, Any] | None, cur: dict[str, Any]) -> dict[str, list[str]]:
    pn = {n["id"] for n in (prev or {}).get("nodes", [])}
    cn = {n["id"] for n in cur.get("nodes", [])}
    pe = {_edge_key(e) for e in (prev or {}).get("edges", [])}
    ce = {_edge_key(e) for e in cur.get("edges", [])}
    return {
        "added_nodes": sorted(cn - pn),
        "removed_nodes": sorted(pn - cn),
        "added_edges": sorted(ce - pe),
        "removed_edges": sorted(pe - ce),
    }


def smells(d: dict[str, Any], flags: dict[str, Any], subject: str) -> list[dict[str, Any]]:
    """Structural problems in one diagram version (deterministic)."""
    if subject == "ood":
        return _ood_smells(d)
    if subject != "system-design":
        return []
    nodes = {n["id"]: n for n in d.get("nodes", []) if isinstance(n, dict) and "id" in n}
    edges = [e for e in d.get("edges", []) if e.get("from") in nodes and e.get("to") in nodes]
    kind = {i: n.get("kind") for i, n in nodes.items()}
    out: list[dict[str, Any]] = []

    def add(rule: str, ids: list[str]) -> None:
        out.append({"rule": rule, "message": SMELL_RULES[rule], "nodes": sorted(ids), "version": d.get("version")})

    bad = [e["from"] for e in edges if kind[e["from"]] in ENTRY_KINDS and kind[e["to"]] in STORE_KINDS | {"cache"}]
    if bad:
        add("client-to-store", bad)
    touched = {e["from"] for e in edges} | {e["to"] for e in edges}
    lonely = [i for i in nodes if i not in touched]
    if lonely and len(nodes) > 1:
        add("orphan-node", lonely)
    queues = [i for i in nodes if kind[i] in {"queue", "stream"} and not any(e["from"] == i for e in edges)]
    if queues:
        add("queue-no-consumer", queues)
    # reachability from entry points (edges are directed requests/data flow)
    entries = [i for i in nodes if kind[i] in ENTRY_KINDS]
    seen, stack = set(entries), list(entries)
    while stack:
        cur = stack.pop()
        for e in edges:
            if e["from"] == cur and e["to"] not in seen:
                seen.add(e["to"])
                stack.append(e["to"])
    unreachable = [i for i in nodes if i not in seen and kind[i] in {"service", "api-gateway", "load-balancer"}]
    if entries and unreachable:
        add("unreachable", unreachable)
    if flags.get("read_heavy"):
        stores = [i for i in nodes if kind[i] in {"sql", "nosql"}]
        if len(stores) == 1 and not any(k in {"cache", "cdn"} for k in kind.values()):
            add("single-store-read-heavy", stores)
    if flags.get("needs_lb"):
        direct = [e["to"] for e in edges if kind[e["from"]] in ENTRY_KINDS and kind[e["to"]] == "service"]
        if direct and not any(k in {"load-balancer", "api-gateway"} for k in kind.values()):
            add("no-load-balancer", direct)
    return out


def _ood_smells(d: dict[str, Any]) -> list[dict[str, Any]]:
    nodes = {n["id"]: n for n in d.get("nodes", []) if isinstance(n, dict) and "id" in n}
    edges = [e for e in d.get("edges", []) if e.get("from") in nodes and e.get("to") in nodes]
    out: list[dict[str, Any]] = []
    touched = {e["from"] for e in edges} | {e["to"] for e in edges}
    lonely = [i for i, n in nodes.items() if i not in touched and n.get("kind") != "enum"]
    if lonely and len(nodes) > 1:
        out.append(
            {
                "rule": "orphan-class",
                "message": SMELL_RULES["orphan-class"],
                "nodes": sorted(lonely),
                "version": d.get("version"),
            }
        )
    abstract = [i for i, n in nodes.items() if n.get("kind") in {"interface", "abstract"}]
    unimpl = [
        i
        for i in abstract
        if not any(e["to"] == i and nodes[e["from"]].get("kind") in {"class", "abstract"} for e in edges)
    ]
    if unimpl:
        out.append(
            {
                "rule": "unimplemented-interface",
                "message": SMELL_RULES["unimplemented-interface"],
                "nodes": sorted(unimpl),
                "version": d.get("version"),
            }
        )
    return out


# ------------------------------------------------------------------ attempts


def empty_design() -> dict[str, Any]:
    return {
        "version": VERSION,
        "scope": {"functional": [], "non_functional": [], "assumptions": [], "out_of_scope": []},
        "api": [],
        "data": [],
        "deep_dives": [],
        "wrapup": dict.fromkeys(WRAPUP_KEYS, ""),
    }


def new_attempt(problem: DesignProblem, label: str | None = None, today: dt.date | None = None) -> Path:
    label = label or "practice"
    if not SLUG_RE.match(label):
        raise ProblemError(f"label must be kebab-case, got {label!r}")
    base = f"{(today or dt.date.today()).isoformat()}_design_{label}"
    name, i = base, 2
    while (problem.attempts_dir / name).exists():
        name, i = f"{base}-{i}", i + 1
    ensure_workspace()
    adir = problem.attempts_dir / name
    (adir / "diagrams").mkdir(parents=True)
    (adir / "design.json").write_text(json.dumps(empty_design(), indent=2) + "\n")
    (adir / "estimates.json").write_text(json.dumps({"version": VERSION, "rows": []}, indent=2) + "\n")
    entry = "client" if problem.subject == "system-design" else "actor"
    v1 = {
        "version": 1,
        "why": "",
        "nodes": [{"id": entry, "kind": entry, "label": entry.title(), "x": 60, "y": 160}],
        "edges": [],
        "flows": [],
    }
    (adir / "diagrams" / "v1.json").write_text(json.dumps(v1, indent=2) + "\n")
    (adir / "signatures.py").write_text(
        f'"""Signatures for {problem.meta.get("title", problem.slug)}: classes, interfaces and function\n'
        'signatures only (no bodies). Checked with `kb sd check`."""\n'
    )
    (adir / "notes.md").write_text(
        f"# {problem.meta.get('title', problem.slug)} — {name}\n\n"
        "Design in the studio console (or edit the JSON here), then `./kb run <this folder>` to check.\n\n"
        "## Runs\n"
    )
    return adir


def attempt_dir(subject: str, slug: str, attempt: str) -> Path:
    if not ATTEMPT_RE.match(attempt or ""):
        raise ProblemError(f"bad attempt name {attempt!r}")
    problem = load(subject, slug)
    adir = problem.attempts_dir / attempt
    if not adir.is_dir():
        raise ProblemError(f"no attempt {attempt} for {subject}/{slug}")
    return adir


def validate_design(d: Any) -> list[str]:
    if not isinstance(d, dict) or d.get("version") != VERSION:
        return [f"design.json must be an object with version {VERSION}"]
    e: list[str] = []
    missing = [k for k in ("scope", "api", "data", "deep_dives", "wrapup") if k not in d]
    if missing:
        e.append(f"design.json is missing {', '.join(missing)} (send the whole document)")
    scope = d.get("scope", {})
    if not isinstance(scope, dict):
        e.append("scope must be an object")
    else:
        for k in ("functional", "non_functional", "assumptions", "out_of_scope"):
            items = scope.get(k, [])
            if not isinstance(items, list) or not all(
                isinstance(x, dict) and isinstance(x.get("text", ""), str) for x in items
            ):
                e.append(f"scope.{k} must be a list of {{id, text}}")
    for k in ("api", "data", "deep_dives"):
        if not isinstance(d.get(k, []), list) or not all(isinstance(x, dict) for x in d.get(k, [])):
            e.append(f"{k} must be a list of objects")
    if not isinstance(d.get("wrapup", {}), dict):
        e.append("wrapup must be an object")
    if len(json.dumps(d)) > 200_000:
        e.append("design.json is too large")
    return e


SAVE_FILES = ("design", "estimates", "diagram", "signatures")


def save(subject: str, slug: str, attempt: str, file: str, content: Any, version: int | None = None) -> Path:
    """Write one attempt file chosen from a fixed set (the studio's only write path)."""
    adir = attempt_dir(subject, slug, attempt)
    if file == "design":
        errors, path, text = validate_design(content), adir / "design.json", json.dumps(content, indent=2) + "\n"
    elif file == "estimates":
        ok = isinstance(content, dict) and isinstance(content.get("rows"), list) and len(content["rows"]) <= MAX_ROWS
        errors = [] if ok else [f"estimates must be {{version, rows: [...]}} with ≤ {MAX_ROWS} rows"]
        if ok:
            bad = sorted(
                {str(r.get("unit")) for r in content["rows"] if isinstance(r, dict) and r.get("unit", "") not in UNITS}
            )
            errors += [f"unknown unit(s) {bad}; use one of {sorted(UNITS)}"] if bad else []
        path, text = adir / "estimates.json", json.dumps(content, indent=2) + "\n"
    elif file == "diagram":
        if not isinstance(version, int) or not 1 <= version <= MAX_VERSIONS:
            raise ProblemError(f"diagram version must be 1..{MAX_VERSIONS}")
        errors = validate_diagram(content, subject)
        existing = len(diagram_versions(adir))
        if version > existing + 1:
            errors.append(f"versions are consecutive: next is v{existing + 1}")
        if isinstance(content, dict) and content.get("version") != version:
            errors.append("diagram.version must match the file version")
        path, text = adir / "diagrams" / f"v{version}.json", json.dumps(content, indent=2) + "\n"
    elif file == "signatures":
        errors = [] if isinstance(content, str) and len(content) < 50_000 else ["signatures must be text"]
        path, text = adir / "signatures.py", str(content)
    else:
        raise ProblemError(f"file must be one of {SAVE_FILES}")
    if errors:
        raise ProblemError("not saved:\n  - " + "\n  - ".join(errors))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return path


def delete_diagram(subject: str, slug: str, attempt: str, version: int) -> None:
    adir = attempt_dir(subject, slug, attempt)
    latest = len(diagram_versions(adir))
    if not isinstance(version, int) or version < 2 or version != latest:
        raise ProblemError(f"only the latest version (v{latest}, if ≥ 2) can be deleted, so versions stay consecutive")
    (adir / "diagrams" / f"v{version}.json").unlink(missing_ok=True)


# ------------------------------------------------------------------ checks


def _values(x: Any) -> list[str]:
    """Leaf string/number values of a JSON value (never its key names)."""
    if isinstance(x, dict):
        return [v for item in x.values() for v in _values(item)]
    if isinstance(x, list):
        return [v for item in x for v in _values(item)]
    return [] if x is None else [str(x)]


def _norm(s: Any) -> str:
    return re.sub(r"\s+", " ", " ".join(_values(s)) if not isinstance(s, str) else s).lower()


def _hit(text: str, keywords: list[str]) -> bool:
    return any(k.lower() in text for k in keywords)


def _signature_names(attempt: Path) -> set[str]:
    """Declared names, lower-cased: `name`, `class.method`, and `class(base)` for each base class."""
    names: set[str] = set()
    py = attempt / "signatures.py"
    if py.exists():
        try:
            tree = ast.parse(py.read_text())
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    names.add(node.name.lower())
                elif isinstance(node, ast.ClassDef):
                    cls = node.name.lower()
                    names.add(cls)
                    for base in node.bases:
                        base_name = base.id if isinstance(base, ast.Name) else getattr(base, "attr", None)
                        if base_name:
                            names.add(f"{cls}({base_name.lower()})")
                    for item in node.body:
                        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            names.add(f"{cls}.{item.name.lower()}")
        except SyntaxError:
            pass
    go = attempt / "signatures.go"
    if go.exists():
        text = go.read_text()
        names |= {m.lower() for m in re.findall(r"\btype\s+([A-Za-z_]\w*)", text)}
        names |= {m.lower() for m in re.findall(r"\bfunc\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)", text)}
        for recv, meth in re.findall(r"\bfunc\s+\(\s*\w+\s+\*?([A-Za-z_]\w*)\s*\)\s*([A-Za-z_]\w*)", text):
            names.add(f"{recv.lower()}.{meth.lower()}")
    return names


def run_checks(problem: DesignProblem, attempt: Path) -> dict[str, Any]:
    """Evaluate an attempt against the rubric. Pure: reads files, writes nothing."""
    errors: list[str] = []
    try:
        design = json.loads((attempt / "design.json").read_text())
        errors += validate_design(design)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        design, errors = empty_design(), [f"design.json: {e}"]
    try:
        est_rows = json.loads((attempt / "estimates.json").read_text()).get("rows", [])
    except (FileNotFoundError, json.JSONDecodeError, AttributeError):
        est_rows = []
    estimates = evaluate_estimates(est_rows if isinstance(est_rows, list) else [])
    versions = diagram_versions(attempt)
    subject = problem.subject
    for v in versions:
        errors += [f"diagrams/v{v.get('version')}: {m}" for m in validate_diagram(v, subject)]
    final = versions[-1] if versions else {"nodes": [], "edges": []}
    kinds = {n.get("id"): n.get("kind") for n in final.get("nodes", [])}
    labels = {n.get("id"): _norm(n.get("label", "")) for n in final.get("nodes", [])}
    scope = design.get("scope", {}) if isinstance(design.get("scope"), dict) else {}
    sig_names = _signature_names(attempt)

    results = []
    for c in problem.rubric.get("checks", []):
        kw = c.get("keywords", [])
        passed, detail = False, ""
        t = c["type"]
        if t == "requirement":
            sections = c.get("sections") or list(scope)
            text = _norm([x.get("text", "") for k in sections for x in scope.get(k, []) if isinstance(x, dict)])
            passed = _hit(text, kw)
        elif t == "estimate":
            for row in estimates:
                if row["value"] is not None and _hit(row["name"].lower(), kw):
                    v = convert(row["value"], row["unit"], c.get("unit", ""))
                    if v is None:
                        detail = f"{row['name']}: unit {row['unit']!r} can't be compared with {c.get('unit')!r}"
                        continue
                    passed = c["min"] <= v <= c["max"]
                    detail = f"{row['name']} ≈ {v:,.3g} {c.get('unit', '')}" + (
                        "" if passed else " (out of the plausible range)"
                    )
                    if passed:
                        break
        elif t == "endpoint":
            passed = any(
                (not c.get("method") or str(r.get("method", "")).upper() == c["method"]) and _hit(_norm(r), kw)
                for r in design.get("api", [])
            )
        elif t == "entity":
            passed = any(_hit(_norm(r), kw) for r in design.get("data", []))
        elif t == "component":
            passed = any(
                k in c["kinds"] and (not kw or _hit(labels.get(i, "") + " " + str(i).lower(), kw))
                for i, k in kinds.items()
            )
        elif t == "edge":

            def node_hit(node_id: Any, words: list[str]) -> bool:
                return not words or _hit(labels.get(node_id, "") + " " + str(node_id).lower(), words)

            passed = any(
                kinds.get(e.get("from")) in c["from_kinds"]
                and kinds.get(e.get("to")) in c["to_kinds"]
                and node_hit(e.get("from"), c.get("from_keywords", []))
                and node_hit(e.get("to"), c.get("to_keywords", []))
                and (not c.get("label_keywords") or _hit(str(e.get("label", "")).lower(), c["label_keywords"]))
                for e in final.get("edges", [])
            )
        elif t == "decision":
            passed = any(
                _hit(_norm(dd), kw)
                and str(dd.get("choice", "")).strip()
                and str(dd.get("why", "")).strip()
                and (not c.get("choice_keywords") or _hit(str(dd.get("choice", "")).lower(), c["choice_keywords"]))
                for dd in design.get("deep_dives", [])
            )
        elif t == "wrapup":
            passed = len(str(design.get("wrapup", {}).get(c["key"], "")).strip()) >= 15
        elif t == "signature":
            missing = [n for n in c["names"] if n.lower() not in sig_names]
            passed = not missing
            detail = "" if passed else f"missing: {', '.join(missing)}"
        results.append(
            {
                "id": c["id"],
                "type": t,
                "stage": CHECK_STAGE[t],
                "label": c["label"],
                "passed": bool(passed),
                "detail": detail,
            }
        )

    flags = problem.rubric.get("flags", {})
    all_smells: list[dict[str, Any]] = []
    out_versions = []
    prev = None
    for v in versions:
        found = smells(v, flags, subject)
        all_smells += found
        out_versions.append(
            {
                "version": v.get("version"),
                "why": v.get("why", ""),
                "nodes": len(v.get("nodes", [])),
                "edges": len(v.get("edges", [])),
                "diff": diff(prev, v),
                "smells": [s["rule"] for s in found],
            }
        )
        prev = v
    final_smells = [s for s in all_smells if s["version"] == final.get("version")]
    missing_why = [v["version"] for v in out_versions[1:] if not str(v["why"]).strip()]
    stages = {
        s: {
            "passed": sum(1 for r in results if r["stage"] == s and r["passed"]),
            "total": sum(1 for r in results if r["stage"] == s),
        }
        for s in STAGES
    }
    passed = sum(1 for r in results if r["passed"])
    return {
        "version": VERSION,
        "subject": subject,
        "slug": problem.slug,
        "attempt": attempt.name,
        "checks": results,
        "stages": stages,
        "passed": passed,
        "total": len(results),
        "smells": all_smells,
        "final_smells": final_smells,
        "versions": out_versions,
        "versions_missing_why": missing_why,
        "estimates": estimates,
        "errors": errors,
        "submitted": (attempt / "submitted.json").exists(),
    }


def record(result: dict[str, Any]) -> None:
    """Append a check to progress (only on an explicit check/submit, never on autosave)."""
    history.record_run(
        {
            "subject": result["subject"],
            "slug": result["slug"],
            "attempt": result["attempt"],
            "lang": "design",
            "passed": result["passed"],
            "total": result["total"],
            "error": bool(result["errors"]),
            "verdict": not result["final_smells"] and not result["versions_missing_why"],
            "fit": None,
            "smells": len(result["final_smells"]),
        }
    )


def submit(problem: DesignProblem, attempt: Path) -> dict[str, Any]:
    result = run_checks(problem, attempt)
    (attempt / "submitted.json").write_text(json.dumps({"ts": history.now()}) + "\n")
    result["submitted"] = True
    record(result)
    return result


# ------------------------------------------------------------------ tips and spoilers


def tip(problem: DesignProblem, check_id: str, level: str, attempt: str | None = None) -> str:
    if level not in TIP_LEVELS:
        raise ProblemError(f"level must be one of {TIP_LEVELS}")
    check = next((c for c in problem.rubric.get("checks", []) if c["id"] == check_id), None)
    if check is None:
        raise ProblemError(f"no check {check_id!r}")
    history._append(  # noqa: SLF001 - tips are part of progress
        "tips.jsonl",
        {
            "ts": history.now(),
            "subject": problem.subject,
            "slug": problem.slug,
            "attempt": attempt,
            "check": check_id,
            "level": level,
        },
    )
    return str(check["tips"][level])


def public_problem(problem: DesignProblem) -> dict[str, Any]:
    """What the console may show before submitting: no reference, pattern, keywords or tips."""
    checks = [
        {"id": c["id"], "type": c["type"], "stage": CHECK_STAGE[c["type"]], "label": c["label"]}
        for c in problem.rubric.get("checks", [])
    ]
    return {
        "subject": problem.subject,
        "slug": problem.slug,
        "title": problem.meta["title"],
        "difficulty": problem.meta["difficulty"],
        "topics": problem.meta.get("topics", []),
        "minutes": problem.meta.get("minutes"),
        "readme": (problem.dir / "README.md").read_text(),
        "readme_path": f"{problem.subject}/problems/{problem.slug}/README.md",
        "palette": PALETTES[problem.subject],
        "stages": STAGES if problem.subject == "system-design" else [s for s in STAGES if s != "estimates"],
        "wrapup_keys": WRAPUP_KEYS,
        "units": sorted(UNITS),
        "constants": CONSTANTS,
        "checks": checks,
        "attempts": [
            {"name": a.name, "path": str(a.resolve()), "submitted": (a / "submitted.json").exists()}
            for a in problem.attempts()
        ],
    }


def reference(problem: DesignProblem, attempt: Path) -> dict[str, Any]:
    if not (attempt / "submitted.json").exists():
        raise ProblemError("submit your attempt first: the reference is a spoiler")
    ref = problem.dir / "reference"
    return {
        "walkthrough": (problem.dir / "reference.md").read_text(),
        "pattern": problem.rubric.get("pattern", ""),
        "diagrams": diagram_versions(ref),
        "design": json.loads((ref / "design.json").read_text()),
        "estimates": evaluate_estimates(
            json.loads((ref / "estimates.json").read_text()).get("rows", [])
            if (ref / "estimates.json").exists()
            else []
        ),
        "tips": {c["id"]: c["tips"]["show"] for c in problem.rubric.get("checks", [])},
    }


def attempt_payload(problem: DesignProblem, attempt: Path) -> dict[str, Any]:
    def read(name: str, default: Any) -> Any:
        try:
            return json.loads((attempt / name).read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return default

    sig = attempt / "signatures.py"
    return {
        "name": attempt.name,
        "path": str(attempt.resolve()),
        "design": read("design.json", empty_design()),
        "estimates": read("estimates.json", {"version": VERSION, "rows": []}),
        "diagrams": diagram_versions(attempt),
        "signatures": sig.read_text() if sig.exists() else "",
        "check": run_checks(problem, attempt),
    }


# ------------------------------------------------------------------ content validation


def validate_problem(problem: DesignProblem) -> list[str]:
    """Content gate for authored problems; the reference attempt must pass every check, smell-free."""
    e: list[str] = []
    m, subject = problem.meta, problem.subject
    from kb import learn  # local: learn imports scaffold → schema; keep design import-light

    topics = learn.topic_ids(learn.catalog(subject))
    if m.get("kind") != "design":
        e.append('meta.kind must be "design"')
    if not m.get("title"):
        e.append("meta.title is required")
    if m.get("difficulty") not in DIFFICULTIES:
        e.append(f"meta.difficulty must be one of {sorted(DIFFICULTIES)}")
    if not m.get("topics") or any(t not in topics for t in m.get("topics", [])):
        e.append(f"meta.topics must be non-empty {subject} catalog ids")
    readme = problem.dir / "README.md"
    if not readme.exists() or "<!--" in readme.read_text():
        e.append("README.md missing or still has <!-- --> placeholders")
    if not (problem.dir / "reference.md").exists():
        e.append("reference.md is missing")
    r = problem.rubric
    if r.get("version") != VERSION:
        e.append(f"rubric.version must be {VERSION}")
    if not r.get("pattern"):
        e.append("rubric.pattern (the transferable lesson) is required")
    unknown_flags = set(r.get("flags", {})) - set(FLAG_RULES)
    if unknown_flags:
        e.append(f"unknown rubric flags {sorted(unknown_flags)}")
    ids = set()
    palette = set(PALETTES[subject])
    for i, c in enumerate(r.get("checks", [])):
        where = f"checks[{i}] ({c.get('id')})"
        if not SLUG_RE.match(str(c.get("id", ""))) or c["id"] in ids:
            e.append(f"{where}: id must be unique kebab-case")
        ids.add(c.get("id"))
        t = c.get("type")
        if t not in CHECK_STAGE:
            e.append(f"{where}: type must be one of {sorted(CHECK_STAGE)}")
            continue
        if not c.get("label"):
            e.append(f"{where}: label is required (shown before submit: don't give the answer away)")
        tips = c.get("tips", {})
        if not isinstance(tips, dict) or any(not tips.get(level) for level in TIP_LEVELS):
            e.append(f"{where}: tips need nudge, hint and show")
        if t in {"requirement", "endpoint", "entity", "decision", "estimate"} and not c.get("keywords"):
            e.append(f"{where}: keywords are required")
        if t == "estimate":
            if (
                c.get("unit", "") not in UNITS
                or not isinstance(c.get("min"), (int, float))
                or not isinstance(c.get("max"), (int, float))
            ):
                e.append(f"{where}: estimate needs a known unit and numeric min/max")
            elif c["min"] >= c["max"]:
                e.append(f"{where}: min must be < max")
        if t == "component" and (not c.get("kinds") or not set(c["kinds"]) <= palette):
            e.append(f"{where}: kinds must come from the {subject} palette")
        if t == "edge" and (
            not set(c.get("from_kinds", [])) <= palette
            or not set(c.get("to_kinds", [])) <= palette
            or not c.get("from_kinds")
            or not c.get("to_kinds")
        ):
            e.append(f"{where}: from_kinds/to_kinds must come from the {subject} palette")
        if t == "edge" and any(
            not isinstance(c.get(k, []), list) for k in ("from_keywords", "to_keywords", "label_keywords")
        ):
            e.append(f"{where}: from_keywords/to_keywords/label_keywords must be lists")
        if t == "requirement" and not set(c.get("sections", [])) <= {
            "functional",
            "non_functional",
            "assumptions",
            "out_of_scope",
        }:
            e.append(f"{where}: sections must be scope sections")
        if t == "wrapup" and c.get("key") not in WRAPUP_KEYS:
            e.append(f"{where}: key must be one of {WRAPUP_KEYS}")
        if t == "signature" and not c.get("names"):
            e.append(f"{where}: names are required")
        if t == "endpoint" and c.get("method") and c["method"] not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
            e.append(f"{where}: method must be an HTTP verb")
    if len(ids) < 5:
        e.append("rubric needs at least 5 checks")
    ref = problem.dir / "reference"
    if not (ref / "design.json").exists():
        return e + ["reference/ attempt is missing (design.json, estimates.json, diagrams/v1..vN.json)"]
    res = run_checks(problem, ref)
    e += [f"reference: {x}" for x in res["errors"]]
    failing = [c["id"] for c in res["checks"] if not c["passed"]]
    if failing:
        e.append(f"reference must pass every check; failing: {', '.join(failing)}")
    if res["final_smells"]:
        e.append(f"reference final version has smells: {', '.join(s['rule'] for s in res['final_smells'])}")
    if len(res["versions"]) < 2 and subject == "system-design":
        e.append("reference should evolve: at least v1 (naive) and v2")
    if res["versions_missing_why"]:
        e.append(f"reference versions need a 'why': {res['versions_missing_why']}")
    est_errors = [f"{x['name']}: {x['error']}" for x in res["estimates"] if x["error"]]
    if est_errors:
        e.append("reference estimates: " + "; ".join(est_errors))
    return e
