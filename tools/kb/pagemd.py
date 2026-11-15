"""Studio pages as plain markdown for LLM agents ("Copy page" / GET /api/md/... / `kb md`).

Every learning page has a markdown twin built from the same repo content the page renders: prose and
code as written, figures and design diagrams as Mermaid (kb/mermaid.py), traces as code + narration,
quizzes without answers. Private workspace data (attempts, reviews, progress) is never included.

Kinds: lesson (subject, topic), problem (algo problem), design (design problem description),
solution (design reference walkthrough, a spoiler: the studio offers it only once revealed).
"""

from __future__ import annotations

import json
import re
from collections.abc import Callable
from pathlib import Path
from typing import Any

from kb import design, figures, learn, mermaid
from kb.schema import ProblemError, load_problem

DIAGRAM_FENCE_RE = re.compile(r"^```diagram[ \t]*\n([^\n`]*)\n```", re.M)
VERSION_FENCE_RE = re.compile(r"^```diagram[ \t]*\n\s*v\d+\s*\n```", re.M | re.I)
_LANGS = {".py": "python", ".go": "go"}


def build(kind: str, subject: str, slug: str) -> str:
    """Markdown for one page. Raises ProblemError for an unknown kind, subject or slug."""
    builder = BUILDERS.get(kind)
    if builder is None:
        raise ProblemError(f"unknown page kind {kind!r} (one of {', '.join(BUILDERS)})")
    return builder(subject, slug).rstrip() + "\n"


# ------------------------------------------------------------------ lesson


def lesson_md(subject: str, topic: str) -> str:
    ldir, lesson = learn.lesson_dir(subject, topic), learn.load_lesson(subject, topic)
    parts = [_lesson_block(subject, ldir, b, lesson["blocks"]) for b in lesson["blocks"]]
    if not (parts and parts[0].lstrip().startswith("# ")):  # the first markdown file usually has the H1
        parts.insert(0, f"# {lesson['title']}")
    from kb import refs  # local import: refs imports learn

    parts.append(_resources(refs.for_topic(subject, topic)))
    return "\n\n".join(p for p in parts if p)


def _lesson_block(subject: str, ldir: Path, block: dict[str, Any], blocks: list[dict[str, Any]]) -> str:
    kind = block["type"]
    if kind == "race":
        return _race(learn._race(ldir, blocks, block))  # noqa: SLF001 - same scoreboard as the studio
    if kind == "markdown":
        return _with_figures(ldir, (ldir / block["src"]).read_text())
    if kind == "trace":
        return _trace(block, json.loads((ldir / "traces" / f"{block['id']}.json").read_text()))
    if kind == "quiz":
        return _quiz(json.loads((ldir / block["src"]).read_text()))
    if kind == "problems":
        return _problem_links(subject, block["slugs"])
    return ""


def _with_figures(ldir: Path, text: str) -> str:
    """Replace every ```figure <name> fence with the figure as markdown + Mermaid."""

    def render(m: re.Match[str]) -> str:
        p = figures.path(ldir, m.group(1).strip())
        if not p.is_file():
            return f"_(missing figure {m.group(1).strip()})_"
        return mermaid.figure_md(json.loads(p.read_text()))

    return figures.FENCE_RE.sub(render, text)


def _trace(block: dict[str, Any], trace: dict[str, Any]) -> str:
    lang = _LANGS.get(Path(block.get("source", "")).suffix, "")
    code = "\n".join(trace.get("code", []))
    args = ", ".join(f"{k}={json.dumps(v, ensure_ascii=False)}" for k, v in trace.get("input", {}).items())
    parts = [
        f"### Trace: {trace.get('title', block['id'])}",
        f"```{lang or 'text'}\n{code}\n```",
        f"Run: `{block.get('function', 'solution')}({args})` → `{json.dumps(trace.get('result'), ensure_ascii=False)}`",
    ]
    steps = enumerate(trace.get("steps", []), 1)
    notes = [f"- step {i} (line {s.get('line')}): {s['note']}" for i, s in steps if s.get("note")]
    if notes:
        parts.append(f"Narrated steps ({len(trace.get('steps', []))} in total):\n\n" + "\n".join(notes))
    return "\n\n".join(parts)


def _race(race: dict[str, Any]) -> str:
    """A race as its scoreboard (the traces of each runner are already on the page)."""
    rows = ["| runner | cells expanded | route found (moves) |", "|---|---|---|"]
    for r in race["runners"]:
        moves = r["stats"]["moves"]
        rows.append(f"| {r['label']} | {r['stats']['expanded']} | {moves if moves is not None else 'none'} |")
    return f"### {race['title']}\n\n" + "\n".join(rows)


def _quiz(quiz: dict[str, Any]) -> str:
    """Questions and options only: answers are graded by the studio and stay out of the copy."""
    out = ["## Quiz", "_Pick the pattern for each problem (answers are not included)._"]
    for i, q in enumerate(quiz.get("items", []), 1):
        options = "\n".join(f"   - {o}" for o in q.get("options", []))
        out.append(f"{i}. {q['prompt']}\n{options}")
    return "\n\n".join(out)


def _problem_links(subject: str, slugs: list[str]) -> str:
    rows = [_problem_row(subject, s) for s in slugs]
    return "## Practice problems\n\n" + "\n".join(rows) if rows else ""


def _problem_row(subject: str, slug: str) -> str:
    if design.is_design_subject(subject):
        meta = design.load(subject, slug).meta
    else:
        meta = load_problem(learn.learn_root() / subject / "problems" / slug).meta
    return f"- **{meta['title']}** (`{slug}`, {meta.get('difficulty', '?')})"


def _resources(resources: list[dict[str, Any]]) -> str:
    if not resources:
        return ""
    rows = []
    for r in resources:
        title = f"[{r['title']}]({r['url']})" if r.get("url") else r["title"]
        page = f", p. {r['page']}" if r.get("page") else ""
        rows.append(f"- {title} ({r['source_name']}{page}): {r['summary']}")
    return "## Resources\n\n" + "\n".join(rows)


# ------------------------------------------------------------------ problems


def problem_md(subject: str, slug: str) -> str:
    learn.catalog(subject)  # validates the subject id
    problem = load_problem(learn.learn_root() / subject / "problems" / learn._check_id(slug, "problem"))  # noqa: SLF001
    return (problem.dir / "README.md").read_text()


def design_problem_md(subject: str, slug: str) -> str:
    return (design.load(subject, slug).dir / "README.md").read_text()


def design_solution_md(subject: str, slug: str) -> str:
    problem = design.load(subject, slug)
    sol = design.solution(problem)
    walkthrough = sol["walkthrough"]
    body = _with_diagrams(walkthrough, sol["diagrams"], sol["design"].get("parts", []))
    head, _, rest = body.partition("\n") if body.startswith("# ") else ("", "", body)
    parts = [head or f"# {problem.meta.get('title', slug)}: reference solution", _solution_band(sol), rest]
    if sol["diagrams"] and not VERSION_FENCE_RE.search(walkthrough):  # older layout: versions gallery
        parts.append("## Design versions\n\n" + "\n\n".join(_version(d) for d in _by_version(sol["diagrams"])))
    parts.append(_estimates(sol["estimates"]))
    return "\n\n".join(p.strip("\n") for p in parts if p.strip())


def _solution_band(sol: dict[str, Any]) -> str:
    rows = []
    if sol.get("technologies"):
        rows.append(f"- **Technologies:** {', '.join(sol['technologies'])}")
    if sol.get("patterns"):
        rows.append(f"- **Patterns:** {', '.join(sol['patterns'])}")
    if sol.get("pattern"):
        rows.append(f"- **Transferable pattern:** {sol['pattern']}")
    return "\n".join(rows)


def _with_diagrams(text: str, diagrams: list[dict[str, Any]], parts: list[dict[str, Any]]) -> str:
    """Replace ```diagram fences (`v2` = design version 2, `part:P1` = part P1) with Mermaid."""
    versions = {d.get("version"): d for d in diagrams}
    by_id = {p.get("id"): p for p in parts}

    def render(m: re.Match[str]) -> str:
        body = m.group(1).strip()
        if (v := re.fullmatch(r"[vV](\d+)", body)) and int(v.group(1)) in versions:
            return _version(versions[int(v.group(1))])
        if (p := re.fullmatch(r"part:\s*([A-Za-z0-9_-]+)", body)) and p.group(1) in by_id:
            return _part(by_id[p.group(1)])
        return f"_(missing diagram {body})_"

    return DIAGRAM_FENCE_RE.sub(render, text)


def _by_version(diagrams: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(diagrams, key=lambda d: d.get("version", 0))


def _version(d: dict[str, Any]) -> str:
    head = f"**Design v{d.get('version')}**" + (f": {d['why']}" if d.get("why") else "")
    return head + "\n\n" + mermaid.diagram_md(d.get("nodes", []), d.get("edges", []))


def _part(p: dict[str, Any]) -> str:
    covers = f" (covers {', '.join(p['covers'])})" if p.get("covers") else ""
    lines = [f"**Part {p.get('id')}: {p.get('title', '')}**{covers}"]
    if p.get("choice"):
        lines.append(f"Choice: {p['choice']}")
    tags = [*p.get("technologies", []), *p.get("patterns", [])]
    if tags:
        lines.append(f"Uses: {', '.join(tags)}")
    diagram = p.get("diagram") or {}
    if diagram.get("nodes"):
        lines.append(mermaid.diagram_md(diagram["nodes"], diagram.get("edges", [])))
    return "\n\n".join(lines)


def _estimates(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return ""
    out = ["## Estimates", "| name | formula | value | unit |", "|---|---|---|---|"]
    for r in rows:
        value = "error" if r.get("value") is None else _number(r["value"])
        out.append(f"| {r['name']} | `{r['formula']}` | {value} | {r['unit']} |")
    return "\n".join(out[:1]) + "\n\n" + "\n".join(out[1:])


def _number(v: float) -> str:
    return f"{v:,.0f}" if abs(v) >= 1000 else f"{v:.4g}"


BUILDERS: dict[str, Callable[[str, str], str]] = {
    "lesson": lesson_md,
    "problem": problem_md,
    "design": design_problem_md,
    "solution": design_solution_md,
}
