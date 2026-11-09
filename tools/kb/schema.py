"""Problem definition (meta.json + cases.json): loading, type system and validation."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from kb.naming import IDENT_RE, SLUG_RE
from kb.paths import attempts_root, subject_of

BASE_TYPES = {"int", "float", "string", "bool", "ListNode", "TreeNode"}
COMPARATORS = {"exact", "unordered", "unordered_deep", "float", "any_of"}
DIFFICULTIES = {"easy", "medium", "hard"}
KINDS = {"function", "design"}
LANGS = {"python", "go"}
MAX_ARRAY_DEPTH = 2


class ProblemError(Exception):
    """Raised when a problem directory cannot be loaded."""


def split_type(t: str) -> tuple[str, int]:
    """'int[][]' -> ('int', 2)."""
    depth = 0
    while t.endswith("[]"):
        t = t[:-2]
        depth += 1
    return t, depth


def is_type(t: Any, allow_void: bool = False) -> bool:
    if not isinstance(t, str):
        return False
    if allow_void and t == "void":
        return True
    base, depth = split_type(t)
    return base in BASE_TYPES and depth <= MAX_ARRAY_DEPTH


def uses_structs(meta: dict[str, Any]) -> set[str]:
    """Which of ListNode / TreeNode appear anywhere in the signature."""
    types: list[str] = []
    for sig in signatures(meta):
        types += [p["type"] for p in sig.get("params", [])]
        types.append(sig.get("returns", "void"))
    return {split_type(t)[0] for t in types} & {"ListNode", "TreeNode"}


def signatures(meta: dict[str, Any]) -> list[dict[str, Any]]:
    """All callable signatures of a problem (function, or constructor + methods)."""
    if meta.get("kind") == "design":
        ctor = dict(meta.get("constructor") or {"params": []})
        ctor.setdefault("returns", "void")
        return [ctor, *meta.get("methods", [])]
    return [meta]


@dataclass
class Problem:
    dir: Path
    meta: dict[str, Any]
    cases: list[dict[str, Any]]

    @property
    def slug(self) -> str:
        return self.dir.name

    @property
    def subject(self) -> str:
        return subject_of(self.dir)

    @property
    def attempts_dir(self) -> Path:
        """Attempts live in the learner's private workspace, not next to the problem."""
        return attempts_root(self.subject, self.slug)

    def attempts(self) -> list[Path]:
        if not self.attempts_dir.is_dir():
            return []
        return sorted(p for p in self.attempts_dir.iterdir() if p.is_dir())


def _load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except FileNotFoundError as e:
        raise ProblemError(f"missing {path.name} in {path.parent}") from e
    except json.JSONDecodeError as e:
        raise ProblemError(f"{path}: invalid JSON: {e}") from e


def load_problem(problem_dir: Path) -> Problem:
    if not problem_dir.is_dir():
        raise ProblemError(f"no such problem: {problem_dir}")
    meta = _load_json(problem_dir / "meta.json")
    cases = _load_json(problem_dir / "cases.json")
    if not isinstance(meta, dict):
        raise ProblemError("meta.json must be an object")
    if not isinstance(cases, list):
        raise ProblemError("cases.json must be a list")
    return Problem(problem_dir, meta, cases)


def _check_params(params: Any, where: str, errors: list[str]) -> list[str]:
    if not isinstance(params, list):
        errors.append(f"{where}.params must be a list")
        return []
    names: list[str] = []
    for i, p in enumerate(params):
        if not isinstance(p, dict) or not IDENT_RE.match(str(p.get("name", ""))):
            errors.append(f"{where}.params[{i}] needs an identifier 'name'")
            continue
        if not is_type(p.get("type")):
            errors.append(f"{where}.params[{i}] ({p['name']}): unknown type {p.get('type')!r}")
        names.append(p["name"])
    if len(set(names)) != len(names):
        errors.append(f"{where}.params has duplicate names")
    return names


def validate(problem: Problem) -> list[str]:
    """Return a list of human-readable problems; empty means valid."""
    m, errors = problem.meta, []

    if not SLUG_RE.match(problem.slug):
        errors.append(f"directory name {problem.slug!r} is not a kebab-case slug")
    if m.get("slug") != problem.slug:
        errors.append(f"meta.slug {m.get('slug')!r} != directory name {problem.slug!r}")
    for key in ("title", "type", "difficulty", "kind", "comparator"):
        if not isinstance(m.get(key), str) or not m.get(key):
            errors.append(f"meta.{key} is required")
    if m.get("difficulty") not in DIFFICULTIES:
        errors.append(f"meta.difficulty must be one of {sorted(DIFFICULTIES)}")
    if m.get("kind") not in KINDS:
        errors.append(f"meta.kind must be one of {sorted(KINDS)}")
    if m.get("comparator") not in COMPARATORS:
        errors.append(f"meta.comparator must be one of {sorted(COMPARATORS)}")
    pats = m.get("patterns")
    if not isinstance(pats, list) or not pats or not all(isinstance(p, str) for p in pats):
        errors.append("meta.patterns must be a non-empty list of strings")
    srcs = m.get("sources", [])
    if not isinstance(srcs, list) or not all(isinstance(s, dict) and s.get("name") for s in srcs):
        errors.append("meta.sources must be a list of {name, url?}")
    else:
        from kb import refs  # local import: refs -> learn -> schema

        index = refs.source_index()
        unknown = [s["name"] for s in srcs if not refs.resolves(s["name"], index)]
        if unknown:
            errors.append(f"meta.sources {unknown} not in resources/sources.json (add the source or an alias)")
    ec = m.get("expected_complexity")
    if not isinstance(ec, dict) or not ec.get("time") or not ec.get("space"):
        errors.append("meta.expected_complexity needs 'time' and 'space'")
    elif "?" in str(ec.get("time")) + str(ec.get("space")):
        errors.append("meta.expected_complexity still has the '?' placeholder")
    if isinstance(pats, list) and "todo" in pats:
        errors.append("meta.patterns still has the 'todo' placeholder")
    readme = problem.dir / "README.md"
    if not readme.exists():
        errors.append("README.md is missing")
    elif "<!--" in readme.read_text():
        errors.append("README.md still has template <!-- ... --> placeholders (fill or delete them)")
    else:
        from kb import mdlint
        from kb.scaffold import readme_header  # local import: scaffold imports schema

        errors += mdlint.check(readme.read_text(), "README.md")

        header = next((ln for ln in readme.read_text().splitlines() if ln.startswith("> Difficulty:")), None)
        if header is not None and header != readme_header(m):
            errors.append("README.md header line is out of date with meta.json — run `./kb sync`")

    if m.get("kind") == "design":
        errors += _validate_design(problem)
    elif m.get("kind") == "function":
        errors += _validate_function(problem)
    return errors


def _validate_function(problem: Problem) -> list[str]:
    m, errors = problem.meta, []
    if not IDENT_RE.match(str(m.get("function", ""))):
        errors.append("meta.function must be an identifier (camelCase)")
    names = _check_params(m.get("params"), "meta", errors)
    returns = m.get("returns")
    if not is_type(returns, allow_void=True):
        errors.append(f"meta.returns: unknown type {returns!r}")
    if returns == "void" and m.get("output") not in names:
        errors.append("meta.returns is 'void': set meta.output to the param mutated in place")

    if not problem.cases:
        errors.append("cases.json is empty")
    seen: set[str] = set()
    for i, c in enumerate(problem.cases):
        where = f"cases[{i}]"
        if not isinstance(c, dict):
            errors.append(f"{where} must be an object")
            continue
        name = c.get("name")
        if not name:
            errors.append(f"{where} needs a 'name'")
        elif name in seen:
            errors.append(f"{where}: duplicate name {name!r}")
        seen.add(str(name))
        args = c.get("args")
        if not isinstance(args, dict) or set(args) != set(names):
            errors.append(f"{where} ({name}): args keys must be exactly {names}")
        if "expected" not in c:
            errors.append(f"{where} ({name}): missing 'expected'")

    bench = m.get("bench")
    if bench is not None:
        if not isinstance(bench, dict) or not isinstance(bench.get("args"), dict):
            errors.append("meta.bench must be an object with 'args'")
        elif set(bench["args"]) != set(names):
            errors.append(f"meta.bench.args keys must be exactly {names}")
        elif not all(isinstance(v, str) for v in bench["args"].values()):
            errors.append("meta.bench.args values must be generator expressions (strings)")
    return errors


def _validate_design(problem: Problem) -> list[str]:
    m, errors = problem.meta, []
    if not IDENT_RE.match(str(m.get("class", ""))):
        errors.append("meta.class must be an identifier (PascalCase)")
    ctor_names = _check_params((m.get("constructor") or {}).get("params", []), "meta.constructor", errors)
    methods: dict[str, int] = {}
    for i, meth in enumerate(m.get("methods") or []):
        if not isinstance(meth, dict) or not IDENT_RE.match(str(meth.get("name", ""))):
            errors.append(f"meta.methods[{i}] needs an identifier 'name'")
            continue
        names = _check_params(meth.get("params", []), f"meta.methods[{i}]", errors)
        if not is_type(meth.get("returns"), allow_void=True):
            errors.append(f"meta.methods[{i}].returns: unknown type {meth.get('returns')!r}")
        methods[meth["name"]] = len(names)
    if not methods:
        errors.append("meta.methods must list at least one method")

    if not problem.cases:
        errors.append("cases.json is empty")
    for i, c in enumerate(problem.cases):
        where = f"cases[{i}] ({c.get('name') if isinstance(c, dict) else '?'})"
        if not isinstance(c, dict) or not c.get("name"):
            errors.append(f"{where} needs a 'name'")
            continue
        if not isinstance(c.get("ctor", []), list) or len(c.get("ctor", [])) != len(ctor_names):
            errors.append(f"{where}: ctor must be a list of {len(ctor_names)} values")
        ops, op_args, exp = c.get("ops"), c.get("op_args"), c.get("expected")
        if not isinstance(ops, list) or not isinstance(op_args, list) or not isinstance(exp, list):
            errors.append(f"{where}: needs lists 'ops', 'op_args', 'expected'")
            continue
        if not len(ops) == len(op_args) == len(exp):
            errors.append(f"{where}: ops, op_args and expected must have equal length")
        for op, a in zip(ops, op_args, strict=False):
            if op not in methods:
                errors.append(f"{where}: unknown op {op!r}")
            elif not isinstance(a, list) or len(a) != methods[op]:
                errors.append(f"{where}: op {op!r} takes {methods[op]} args")
    return errors
