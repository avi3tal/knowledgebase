"""Create problems and attempts, and build the problems index."""

from __future__ import annotations

import datetime as dt
import json
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path
from string import Template
from typing import Any

from kb import codegen
from kb.naming import SLUG_RE, camel, title_from_slug
from kb.paths import TEMPLATES
from kb.schema import LANGS, Problem, ProblemError, load_problem, validate

SOLUTION_FILE = {"python": "solution.py", "go": "solution.go"}


def _render(name: str, **values: str) -> str:
    return Template((TEMPLATES / "algo" / name).read_text()).substitute(values)


def parse_source(spec: str) -> dict[str, str]:
    """'leetcode=https://...' or 'leetcode' -> {"name", "url"?}."""
    name, _, url = spec.partition("=")
    return {"name": name, "url": url} if url else {"name": name}


def new_problem(
    problems: Path,
    slug: str,
    title: str | None = None,
    difficulty: str = "medium",
    patterns: list[str] | None = None,
    sources: list[str] | None = None,
) -> Path:
    if not SLUG_RE.match(slug):
        raise ProblemError(f"slug must be kebab-case: {slug!r}")
    pdir = problems / slug
    if pdir.exists():
        raise ProblemError(f"{pdir} already exists — use `kb attempt {slug}` to practise it again")
    title = title or title_from_slug(slug)
    patterns = patterns or ["todo"]
    srcs = [parse_source(s) for s in sources or []]
    values = {
        "title": title,
        "slug": slug,
        "difficulty": difficulty,
        "patterns": ", ".join(patterns),
        "patterns_json": json.dumps(patterns),
        "sources": readme_header({"sources": srcs}).split(" · Sources: ")[1],
        "sources_json": json.dumps(srcs),
        "function": camel(slug),
        "time": "O(?)",
        "space": "O(?)",
    }
    (pdir / "attempts").mkdir(parents=True)
    (pdir / "README.md").write_text(_render("README.md.tmpl", **values))
    (pdir / "meta.json").write_text(_render("meta.json.tmpl", **values))
    (pdir / "cases.json").write_text(_render("cases.json.tmpl", **values))
    return pdir


def _gofmt(path: Path) -> None:
    if shutil.which("gofmt"):
        subprocess.run(["gofmt", "-w", str(path)], check=False, capture_output=True)


def write_go_harness(problem: Problem, attempt_dir: Path) -> None:
    """(Re)generate solution_test.go and kb_types.go from meta.json."""
    test = attempt_dir / "solution_test.go"
    content = codegen.go_test(problem.meta)
    if not test.exists() or test.read_text() != content:
        test.write_text(content)
        _gofmt(test)
    types = codegen.go_types_file(problem.meta)
    types_path = attempt_dir / "kb_types.go"
    if types:
        if not types_path.exists() or types_path.read_text() != types:
            types_path.write_text(types)
    elif types_path.exists():
        types_path.unlink()


def new_attempt(problem: Problem, lang: str, pattern: str | None = None, today: dt.date | None = None) -> Path:
    if lang not in LANGS:
        raise ProblemError(f"lang must be one of {sorted(LANGS)}")
    if pattern is not None and not SLUG_RE.match(pattern):
        raise ProblemError(f"--pattern must be kebab-case (e.g. two-pointers), got {pattern!r}")
    errors = validate(problem)
    if errors:
        raise ProblemError("fix meta.json/cases.json first:\n  - " + "\n  - ".join(errors))
    date = (today or dt.date.today()).isoformat()
    base = f"{date}_{lang}_{pattern or 'practice'}"
    name, i = base, 2
    while (problem.attempts_dir / name).exists():
        name, i = f"{base}-{i}", i + 1
    adir = problem.attempts_dir / name
    adir.mkdir(parents=True)

    meta, ec = problem.meta, problem.meta["expected_complexity"]
    if lang == "python":
        (adir / "solution.py").write_text(codegen.python_stub(meta, name))
    else:
        (adir / "solution.go").write_text(codegen.go_stub(meta, name))
        _gofmt(adir / "solution.go")
        write_go_harness(problem, adir)
    (adir / "notes.md").write_text(
        _render(
            "attempt_notes.md.tmpl",
            title=meta["title"],
            attempt=name,
            lang=lang,
            pattern=pattern or "—",
            time=ec["time"],
            space=ec["space"],
        )
    )
    return adir


def readme_header(meta: dict[str, Any]) -> str:
    """The README's `> Difficulty: …` line, derived from meta.json (kept in sync by `kb sync`)."""
    sources = ", ".join(f"[{s['name']}]({s['url']})" if s.get("url") else s["name"] for s in meta.get("sources", []))
    return (
        f"> Difficulty: **{meta.get('difficulty', '?')}** · Patterns: {', '.join(meta.get('patterns', []))}"
        f" · Sources: {sources or '—'}"
    )


def sync_readme(problem: Problem) -> bool:
    """Rewrite the README header line from meta.json; returns True if the file changed."""
    readme = problem.dir / "README.md"
    if not readme.exists():
        return False
    lines = readme.read_text().split("\n")
    want = readme_header(problem.meta)
    for i, line in enumerate(lines):
        if line.startswith("> Difficulty:"):
            if line == want:
                return False
            lines[i] = want
            readme.write_text("\n".join(lines))
            return True
    return False


def attempt_lang(attempt_dir: Path) -> str:
    for lang, fname in SOLUTION_FILE.items():
        if (attempt_dir / fname).exists():
            return lang
    raise ProblemError(f"no solution.py / solution.go in {attempt_dir}")


def pick_attempt(problem: Problem, name: str | None) -> Path:
    """Named attempt (exact, prefix or substring match) or the one whose solution was edited last."""
    attempts = problem.attempts()
    if not attempts:
        raise ProblemError(f"{problem.slug} has no attempts — run `kb attempt {problem.slug} --lang go|python`")
    if name:
        exact = [a for a in attempts if a.name == name]
        prefixed = [a for a in attempts if a.name.startswith(name)]
        contains = [a for a in attempts if name in a.name]
        found = exact or prefixed or contains
        if len(found) != 1:
            options = ", ".join(a.name for a in attempts)
            raise ProblemError(f"attempt {name!r} {'is ambiguous' if found else 'not found'}; have: {options}")
        return found[0]

    def mtime(a: Path) -> float:
        files = [a / f for f in SOLUTION_FILE.values() if (a / f).exists()]
        return max((f.stat().st_mtime for f in files), default=0.0)

    return max(attempts, key=mtime)


def all_problems(problems: Path) -> list[Problem]:
    out = []
    for d in sorted(p for p in problems.iterdir() if p.is_dir()) if problems.is_dir() else []:
        try:
            out.append(load_problem(d))
        except ProblemError:
            continue
    return out


def build_index(problems: Path) -> str:
    items = all_problems(problems)
    by_pattern: dict[str, list[Problem]] = defaultdict(list)
    for p in items:
        for pat in p.meta.get("patterns", []):
            by_pattern[pat].append(p)

    def row(p: Problem) -> str:
        m: dict[str, Any] = p.meta
        langs = sorted({attempt_lang(a) for a in p.attempts() if any((a / f).exists() for f in SOLUTION_FILE.values())})
        srcs = ", ".join(f"[{s['name']}]({s['url']})" if s.get("url") else s["name"] for s in m.get("sources", []))
        return (
            f"| [{m.get('title', p.slug)}]({p.slug}/README.md) | {m.get('difficulty', '?')} | "
            f"{', '.join(m.get('patterns', []))} | {srcs} | {len(p.attempts())} ({', '.join(langs) or '—'}) |"
        )

    header = "| Problem | Difficulty | Patterns | Sources | Attempts |\n|---|---|---|---|---|"
    lines = [
        "# Problems index",
        "",
        "<!-- Generated by `./kb index` — do not edit by hand. -->",
        "",
        f"{len(items)} problems.",
        "",
        "## By pattern",
    ]
    for pat in sorted(by_pattern):
        lines += ["", f"### {pat}", "", header, *[row(p) for p in by_pattern[pat]]]
    lines += ["", "## All problems", "", header, *[row(p) for p in items], ""]
    return "\n".join(lines)
