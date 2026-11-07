"""Run an attempt against cases.json and benchmark it, for Python and Go."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from kb import gens
from kb.complexity import Fit, estimate
from kb.paths import ROOT, TOOLS
from kb.scaffold import attempt_lang, write_go_harness
from kb.schema import Problem

RUN_TIMEOUT_S = 300  # whole executor; per-case and bench budgets are much smaller


@dataclass
class RunResult:
    lang: str
    cases: list[dict[str, Any]] = field(default_factory=list)
    bench: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None
    bench_note: str | None = None

    @property
    def passed(self) -> int:
        return sum(1 for c in self.cases if c.get("ok"))

    @property
    def all_passed(self) -> bool:
        return self.error is None and bool(self.cases) and self.passed == len(self.cases)

    @property
    def fit(self) -> Fit | None:
        return estimate([(p["n"], p["ns"]) for p in self.bench])


def _bench_plan(problem: Problem, enabled: bool) -> tuple[list[dict[str, Any]] | None, str | None]:
    if not enabled:
        return None, "skipped (--no-bench)"
    if problem.meta.get("kind") == "design":
        return None, "not supported for design problems yet"
    bench = problem.meta.get("bench")
    if not bench:
        return None, "no meta.bench spec"
    return gens.bench_inputs(bench), None


def run(problem: Problem, attempt_dir: Path, bench: bool = True) -> RunResult:
    lang = attempt_lang(attempt_dir)
    inputs, note = _bench_plan(problem, bench)
    with tempfile.TemporaryDirectory(prefix="kb-") as tmp:
        if lang == "python":
            res = _run_python(problem, attempt_dir, inputs, Path(tmp))
        else:
            res = _run_go(problem, attempt_dir, inputs, Path(tmp))
    if not res.all_passed:
        res.bench = []  # timings of a wrong solution are meaningless
        res.bench_note = "skipped (cases failing)" if inputs else note
    elif res.bench_note is None:
        res.bench_note = note
    return res


def _env() -> dict[str, str]:
    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"  # keep attempt dirs clean
    env["PYTHONPATH"] = os.pathsep.join(filter(None, [str(TOOLS), env.get("PYTHONPATH")]))
    return env


def _run_python(problem: Problem, attempt_dir: Path, inputs: list[dict[str, Any]] | None, tmp: Path) -> RunResult:
    spec, out = tmp / "spec.json", tmp / "out.json"
    spec.write_text(
        json.dumps(
            {
                "solution": str(attempt_dir / "solution.py"),
                "meta": problem.meta,
                "cases": problem.cases,
                "bench": inputs,
            }
        )
    )
    timed_out = False
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "kb.pyexec", str(spec), str(out)],
            env=_env(),
            capture_output=True,
            text=True,
            timeout=RUN_TIMEOUT_S,
        )
        stderr = (proc.stderr or proc.stdout).strip()
    except subprocess.TimeoutExpired:
        timed_out, stderr = True, ""
    if not out.exists():
        msg = f"timed out after {RUN_TIMEOUT_S}s" if timed_out else stderr or "executor produced no output"
        return RunResult("python", error=msg)
    data = json.loads(out.read_text())  # written after cases, rewritten after the bench
    note = data.get("bench_note") or ("bench killed: executor timed out" if timed_out else None)
    return RunResult("python", cases=data["cases"], bench=data["bench"], error=data["error"], bench_note=note)


def _run_go(problem: Problem, attempt_dir: Path, inputs: list[dict[str, Any]] | None, tmp: Path) -> RunResult:
    write_go_harness(problem, attempt_dir)
    out, bench_in, bench_out = tmp / "cases.json", tmp / "bench_in.json", tmp / "bench_out.json"
    env = _env() | {"KB_OUT": str(out)}
    run_pattern = "^TestCases$"
    if inputs:
        bench_in.write_text(
            json.dumps([{"n": i["n"], "case": {"name": f"n={i['n']}", "args": i["args"]}} for i in inputs])
        )
        env |= {"KB_BENCH": str(bench_in), "KB_BENCH_OUT": str(bench_out)}
        run_pattern = "^(TestCases|TestKBBench)$"
    if not attempt_dir.resolve().is_relative_to(ROOT):
        return RunResult(
            "go",
            error=f"Go attempts must live inside the repo (its go.mod); {attempt_dir} is outside {ROOT}. "
            "Point KB_WORKSPACE at a folder inside the repo (default: _workspace/).",
        )
    pkg = "./" + attempt_dir.resolve().relative_to(ROOT).as_posix()
    try:
        proc = subprocess.run(
            ["go", "test", "-count=1", "-run", run_pattern, f"-timeout={RUN_TIMEOUT_S}s", pkg],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=RUN_TIMEOUT_S + 60,
        )
        output = (proc.stdout + proc.stderr).strip()
    except subprocess.TimeoutExpired:
        output = f"go test timed out after {RUN_TIMEOUT_S}s"
    except FileNotFoundError:
        return RunResult("go", error="`go` not found on PATH")
    if not out.exists():
        return RunResult("go", error=output or "go test produced no output")
    res = RunResult("go", cases=json.loads(out.read_text()))
    if inputs:
        if bench_out.exists():  # rewritten after every size, so partial data survives a crash
            data = json.loads(bench_out.read_text())
            res.bench, res.bench_note = data.get("points") or [], data.get("note") or None
        markers = ("panic:", "fatal error:", "timed out")
        if res.bench_note is None and any(m in output for m in markers):
            res.bench_note = "bench aborted: " + next(
                (ln.strip() for ln in output.splitlines() if any(m in ln for m in markers)), "go test failed"
            )
    return res
