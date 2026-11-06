"""`kb debug`: run a Python attempt in this process, case by case, with no timeouts.

Unlike `kb run` (subprocess + per-case alarm), this keeps the solution in the debugger's process,
so VS Code breakpoints in solution.py are hit. Go attempts are debugged with the VS Code
"kb: debug Go attempt" launch config (dlv test mode) instead.
"""

from __future__ import annotations

import json
import traceback
from pathlib import Path

from kb.compare import compare_case, normalise
from kb.convert import to_json
from kb.pyexec import load_module, prepare_function, resolve_function, run_design
from kb.scaffold import attempt_lang
from kb.schema import Problem, ProblemError, validate


def run_in_process(problem: Problem, attempt: Path, case_name: str | None = None) -> int:
    if attempt_lang(attempt) != "python":
        raise ProblemError("kb debug runs Python attempts; for Go use the VS Code launch config 'kb: debug Go attempt'")
    errors = validate(problem)
    if errors:
        raise ProblemError("invalid problem:\n  - " + "\n  - ".join(errors))
    cases = [c for c in problem.cases if case_name in (None, c["name"])]
    if not cases:
        raise ProblemError(f"no case named {case_name!r}; have: {', '.join(c['name'] for c in problem.cases)}")
    meta, design = problem.meta, problem.meta["kind"] == "design"
    module = load_module(attempt / "solution.py")
    failed = 0
    for case in cases:
        try:
            if design:
                got = run_design(module, meta, case)
            else:
                thunk, out_type = prepare_function(resolve_function(module, meta), meta, case["args"])
                got = to_json(out_type, thunk())  # ← step into your solution from here
            got = normalise(got)
            ok = compare_case(got, case["expected"], meta["comparator"], design)
            detail = "" if ok else f"\n    got      {json.dumps(got)}\n    expected {json.dumps(case['expected'])}"
        except Exception:  # noqa: BLE001 - show the solution's traceback
            ok, detail = False, "\n" + traceback.format_exc()
        failed += not ok
        print(f"{'✓' if ok else '✗'} {case['name']}{detail}")
    print(f"{len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0
