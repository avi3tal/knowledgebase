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

from kb import runner, scaffold
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
        verdict = matches(fit, ec.get("time", ""), ns)
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


def _log_run(attempt: Path, res: runner.RunResult) -> None:
    notes = attempt / "notes.md"
    if not notes.exists():
        return
    fit = res.fit
    stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    status = "error" if res.error else f"{res.passed}/{len(res.cases)} passed"
    line = f"- {stamp} · {status}" + (f" · ≈{fit.best}" if fit else "") + "\n"
    text = notes.read_text()
    notes.write_text(text + ("" if text.endswith("\n") else "\n") + line)


def cmd_run(a: argparse.Namespace) -> int:
    problem = _load(a.slug)
    errors = validate(problem)
    if errors:
        raise ProblemError("invalid problem:\n  - " + "\n  - ".join(errors))
    attempts = problem.attempts() if a.all else [scaffold.pick_attempt(problem, a.attempt)]
    ok = True
    for attempt in attempts:
        res = runner.run(problem, attempt, bench=not a.no_bench)
        report(problem, attempt, res)
        if not a.no_log:
            _log_run(attempt, res)
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
    s.add_argument("slug")
    s.add_argument("attempt", nargs="?", help="attempt dir name or prefix (default: last edited)")
    s.add_argument("--all", action="store_true", help="run every attempt")
    s.add_argument("--no-bench", action="store_true", help="skip the complexity benchmark")
    s.add_argument("--no-log", action="store_true", help="don't append the result to notes.md")
    s.set_defaults(fn=cmd_run)

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
