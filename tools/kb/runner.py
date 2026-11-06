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

RUN_TIMEOUT_S = 600


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
    if res.bench_note is None:
        res.bench_note = note
    if inputs and not res.bench and res.bench_note is None:
        res.bench_note = "skipped (cases failing)"
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
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "kb.pyexec", str(spec), str(out)],
            env=_env(),
            capture_output=True,
            text=True,
            timeout=RUN_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        return RunResult("python", error=f"timed out after {RUN_TIMEOUT_S}s")
    if not out.exists():
        return RunResult("python", error=(proc.stderr or proc.stdout).strip() or "executor produced no output")
    data = json.loads(out.read_text())
    return RunResult("python", cases=data["cases"], bench=data["bench"], error=data["error"])


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
    pkg = "./" + attempt_dir.resolve().relative_to(ROOT).as_posix()
    try:
        proc = subprocess.run(
            ["go", "test", "-count=1", "-run", run_pattern, f"-timeout={RUN_TIMEOUT_S}s", pkg],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=RUN_TIMEOUT_S + 30,
        )
    except subprocess.TimeoutExpired:
        return RunResult("go", error=f"timed out after {RUN_TIMEOUT_S}s")
    except FileNotFoundError:
        return RunResult("go", error="`go` not found on PATH")
    if not out.exists():
        return RunResult("go", error=(proc.stdout + proc.stderr).strip() or "go test produced no output")
    res = RunResult("go", cases=json.loads(out.read_text()))
    if bench_out.exists():
        res.bench = json.loads(bench_out.read_text())
    return res
