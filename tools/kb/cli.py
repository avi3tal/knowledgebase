"""kb — command line entry point.

kb new <slug> [--title T] [--difficulty D] [--pattern P ...] [--source name=url ...]
kb attempt <slug> --lang python|go [--pattern P]
kb run <slug> [attempt] [--all] [--no-bench] [--no-log]
kb validate [slug ...]
kb list [--pattern P]
kb index
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any

from kb import debug, feedback, history, learn, runner, scaffold, server
from kb.complexity import matches
from kb.paths import ROOT, problems_dir
from kb.schema import DIFFICULTIES, LANGS, Problem, ProblemError, load_problem, validate

_TTY = sys.stdout.isatty()


def _c(code: str, s: str) -> str:
    return f"\033[{code}m{s}\033[0m" if _TTY else s


def green(s: str) -> str:
    return _c("32", s)


def red(s: str) -> str:
    return _c("31", s)


def dim(s: str) -> str:
    return _c("2", s)


def bold(s: str) -> str:
    return _c("1", s)


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(ROOT))
    except ValueError:
        return str(p)


def _load(slug: str) -> Problem:
    return load_problem(problems_dir() / slug)


def _fmt_ns(ns: float | None) -> str:
    if ns is None:
        return ""
    if ns < 1e3:
        return f"{ns:.0f} ns"
    if ns < 1e6:
        return f"{ns / 1e3:.1f} µs"
    if ns < 1e9:
        return f"{ns / 1e6:.2f} ms"
    return f"{ns / 1e9:.2f} s"


def _short(v: Any, limit: int = 80) -> str:
    s = json.dumps(v)
    return s if len(s) <= limit else s[: limit - 3] + "..."


# ---------------------------------------------------------------- commands


def cmd_new(a: argparse.Namespace) -> int:
    pdir = scaffold.new_problem(problems_dir(), a.slug, a.title, a.difficulty, a.pattern, a.source)
    print(f"created {_rel(pdir)}/ — fill README.md, meta.json, cases.json, then:")
    print(f"  ./kb validate {a.slug}\n  ./kb attempt {a.slug} --lang python|go")
    return 0


def cmd_attempt(a: argparse.Namespace) -> int:
    adir = scaffold.new_attempt(_load(a.slug), a.lang, a.pattern)
    sol = scaffold.SOLUTION_FILE[a.lang]
    print(f"created {_rel(adir)}/{sol}")
    print(f"  ./kb run {a.slug} {adir.name}")
    return 0


def report(problem: Problem, attempt: Path, res: runner.RunResult) -> None:
    print(bold(f"{problem.meta.get('title', problem.slug)}") + dim(f" · {attempt.name} ({res.lang})"))
    if res.error:
        print(red("error:"))
        print("  " + res.error.replace("\n", "\n  "))
    width = max((len(c["name"]) for c in res.cases), default=0)
    for c in res.cases:
        mark = green("✓") if c.get("ok") else red("✗")
        line = f"  {mark} {c['name'].ljust(width)}  {dim(_fmt_ns(c.get('ns')))}"
        if not c.get("ok"):
            if c.get("error"):
                line += "\n      " + red(c["error"].strip().replace("\n", "\n      "))
            else:
                line += f"\n      got      {_short(c.get('got'))}\n      expected {_short(c.get('expected'))}"
        print(line)
    if res.cases:
        summary = f"{res.passed}/{len(res.cases)} passed"
        print(("  " + green(summary)) if res.all_passed else ("  " + red(summary)))

    ec = problem.meta.get("expected_complexity", {})
    fit = res.fit
    if fit:
        ns = [p["n"] for p in res.bench]
        verdict = _verdict(problem, res)
        tag = {True: green(" ✓ consistent"), False: red(" ✗ (check your approach)"), None: ""}[verdict]
        print(
            f"  complexity ≈ {bold(fit.best)}{dim(f' (log-log slope {fit.slope:.2f}, n={ns[0]}..{ns[-1]})')}"
            f"   expected {ec.get('time', '?')}{tag}"
        )
        print(dim("  " + "  ".join(f"n={p['n']}:{_fmt_ns(p['ns'])}" for p in res.bench)))
        if res.bench_note:
            print(dim(f"  ({res.bench_note})"))
    else:
        note = res.bench_note or ("too few points" if res.bench else "no data")
        print(dim(f"  complexity: {note} · expected time {ec.get('time', '?')}, space {ec.get('space', '?')}"))


def _verdict(problem: Problem, res: runner.RunResult) -> bool | None:
    fit = res.fit
    if not fit:
        return None
    return matches(fit, problem.meta.get("expected_complexity", {}).get("time", ""), [p["n"] for p in res.bench])


def _log_run(problem: Problem, attempt: Path, res: runner.RunResult) -> None:
    fit = res.fit
    history.record_run(
        {
            "subject": problem.meta.get("type", "algo"),
            "slug": problem.slug,
            "attempt": attempt.name,
            "lang": res.lang,
            "passed": res.passed,
            "total": len(res.cases),
            "error": res.error is not None,
            "fit": fit.best if fit else None,
            "slope": round(fit.slope, 3) if fit else None,
            "verdict": _verdict(problem, res),
        }
    )
    notes = attempt / "notes.md"
    if not notes.exists():
        return
    stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    status = "error" if res.error else f"{res.passed}/{len(res.cases)} passed"
    line = f"- {stamp} · {status}" + (f" · ≈{fit.best}" if fit else "") + "\n"
    text = notes.read_text()
    notes.write_text(text + ("" if text.endswith("\n") else "\n") + line)


def _resolve_target(target: str) -> tuple[Problem, Path | None]:
    """A slug, or a path to a problem / attempt dir / solution file (handy from VS Code tasks)."""
    path = Path(target)
    if "/" not in target and not path.exists():
        return _load(target), None
    path = path.resolve()
    if path.is_file():
        path = path.parent
    if path.parent.name == "attempts":
        return load_problem(path.parent.parent), path
    return load_problem(path), None


def cmd_run(a: argparse.Namespace) -> int:
    problem, attempt_path = _resolve_target(a.slug)
    errors = validate(problem)
    if errors:
        raise ProblemError("invalid problem:\n  - " + "\n  - ".join(errors))
    if a.all:
        attempts = problem.attempts()
    elif attempt_path is not None:
        attempts = [attempt_path]
    else:
        attempts = [scaffold.pick_attempt(problem, a.attempt)]
    ok = True
    for attempt in attempts:
        res = runner.run(problem, attempt, bench=not a.no_bench)
        report(problem, attempt, res)
        if not a.no_log:
            _log_run(problem, attempt, res)
        ok &= res.all_passed
    return 0 if ok else 1


def cmd_validate(a: argparse.Namespace) -> int:
    probs = [_load(s) for s in a.slugs] if a.slugs else scaffold.all_problems(problems_dir())
    bad = 0
    for p in probs:
        errors = validate(p)
        if errors:
            bad += 1
            print(red(f"✗ {p.slug}"))
            for e in errors:
                print(f"    - {e}")
        else:
            print(green(f"✓ {p.slug}"))
    return 1 if bad else 0


def cmd_list(a: argparse.Namespace) -> int:
    for p in scaffold.all_problems(problems_dir()):
        pats = p.meta.get("patterns", [])
        if a.pattern and a.pattern not in pats:
            continue
        print(f"{p.slug:40} {p.meta.get('difficulty', '?'):7} {', '.join(pats):40} {len(p.attempts())} attempts")
    return 0


def cmd_index(a: argparse.Namespace) -> int:
    target = problems_dir() / "INDEX.md"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(scaffold.build_index(problems_dir()))
    print(f"wrote {_rel(target)}")
    return 0


def cmd_debug(a: argparse.Namespace) -> int:
    problem, attempt = _resolve_target(a.target)
    if attempt is None:
        attempt = scaffold.pick_attempt(problem, None)
    return debug.run_in_process(problem, attempt, a.case or None)


def _lessons(target: str | None) -> list[tuple[str, str]]:
    if target:
        subject, _, topic = target.partition("/")
        if not topic:
            raise ProblemError("use <subject>/<topic>, e.g. algo/sliding-window")
        return [(subject, topic)]
    return [(s, t["id"]) for s in learn.subjects() for t in learn.catalog(s)["topics"] if learn.has_lesson(s, t["id"])]


def cmd_learn(a: argparse.Namespace) -> int:
    lessons = _lessons(a.target)
    if a.action == "build":
        for subject, topic in lessons:
            for path in learn.build(subject, topic):
                print(f"built {_rel(path)}")
    if a.action in {"build", "validate"}:
        bad = 0
        for subject, topic in lessons:
            errors = learn.validate(subject, topic)
            bad += bool(errors)
            print(red(f"✗ {subject}/{topic}") if errors else green(f"✓ {subject}/{topic}"))
            for e in errors:
                print(f"    - {e}")
        return 1 if bad else 0
    for s in learn.subjects():  # list
        for t in learn.catalog(s)["topics"]:
            mark = green("lesson") if learn.has_lesson(s, t["id"]) else dim("—")
            print(f"{s}/{t['id']:32} {t['kind']:12} {mark}")
    return 0


def cmd_feedback(a: argparse.Namespace) -> int:
    data = feedback.compute(a.subject, problems_dir(a.subject))
    if a.json:
        print(json.dumps(data, indent=1))
    else:
        print(feedback.render_markdown(data, a.topic), end="")
    return 0


def cmd_studio(a: argparse.Namespace) -> int:
    server.serve(a.port)
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="kb", description="Practice problems: generate, run, evaluate.")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("new", help="scaffold a new problem directory")
    s.add_argument("slug")
    s.add_argument("--title")
    s.add_argument("--difficulty", choices=sorted(DIFFICULTIES), default="medium")
    s.add_argument("--pattern", action="append", help="repeatable, e.g. --pattern two-pointers")
    s.add_argument("--source", action="append", help="repeatable, name or name=url")
    s.set_defaults(fn=cmd_new)

    s = sub.add_parser("attempt", help="start a new practice attempt (stub with the signature)")
    s.add_argument("slug")
    s.add_argument("--lang", choices=sorted(LANGS), required=True)
    s.add_argument("--pattern", help="pattern you intend to practise; used in the attempt dir name")
    s.set_defaults(fn=cmd_attempt)

    s = sub.add_parser("run", help="run an attempt against cases.json and estimate complexity")
    s.add_argument("slug", help="slug, or a path to a problem / attempt dir / solution file")
    s.add_argument("attempt", nargs="?", help="attempt dir name or prefix (default: last edited)")
    s.add_argument("--all", action="store_true", help="run every attempt")
    s.add_argument("--no-bench", action="store_true", help="skip the complexity benchmark")
    s.add_argument("--no-log", action="store_true", help="don't append the result to notes.md")
    s.set_defaults(fn=cmd_run)

    s = sub.add_parser("debug", help="run a Python attempt in-process (no timeouts) so breakpoints work")
    s.add_argument("target", help="slug, attempt dir or solution file")
    s.add_argument("--case", help="only this case name (default: all)")
    s.set_defaults(fn=cmd_debug)

    s = sub.add_parser("learn", help="lessons: list | build traces | validate")
    s.add_argument("action", choices=["list", "build", "validate"])
    s.add_argument("target", nargs="?", help="<subject>/<topic> (default: all lessons)")
    s.set_defaults(fn=cmd_learn)

    s = sub.add_parser("feedback", help="deterministic progress report: weak topics and what to do next")
    s.add_argument("--subject", default="algo")
    s.add_argument("--topic", help="only this catalog topic id")
    s.add_argument("--json", action="store_true")
    s.set_defaults(fn=cmd_feedback)

    s = sub.add_parser("studio", help="serve the learning studio + API on 127.0.0.1")
    s.add_argument("--port", type=int, default=8765)
    s.set_defaults(fn=cmd_studio)

    s = sub.add_parser("validate", help="check meta.json / cases.json")
    s.add_argument("slugs", nargs="*")
    s.set_defaults(fn=cmd_validate)

    s = sub.add_parser("list", help="list problems")
    s.add_argument("--pattern")
    s.set_defaults(fn=cmd_list)

    s = sub.add_parser("index", help="regenerate problems/INDEX.md")
    s.set_defaults(fn=cmd_index)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except ProblemError as e:
        print(red(f"kb: {e}"), file=sys.stderr)
        return 2
