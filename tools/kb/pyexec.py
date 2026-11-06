"""Subprocess entry point that runs a Python attempt: ``python -m kb.pyexec spec.json out.json``.

Runs in its own process so a crashing or hanging solution cannot take kb down.
spec = {"solution": path, "meta": {...}, "cases": [...], "bench": [{"n", "args"}] | null}
out  = {"cases": [{name, ok, got, expected, error, ns}], "bench": [{n, ns}], "error": str | null}
"""

from __future__ import annotations

import importlib.util
import json
import signal
import statistics
import sys
import time
import traceback
from collections.abc import Callable
from pathlib import Path
from types import ModuleType
from typing import Any

from kb.compare import compare_case, normalise
from kb.convert import to_json, to_py
from kb.naming import snake

CASE_TIMEOUT_S = 10
BENCH_TARGET_S = 0.2
BENCH_MAX_REPS = 50
BENCH_STOP_CALL_S = 0.5


class CaseTimeout(Exception):
    pass


def _on_alarm(signum: int, frame: Any) -> None:
    raise CaseTimeout(f"timed out after {CASE_TIMEOUT_S}s")


def load_module(path: Path) -> ModuleType:
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location("solution", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _lookup(owner: Any, name: str) -> Any:
    for candidate in (snake(name), name):
        if hasattr(owner, candidate):
            return getattr(owner, candidate)
    raise AttributeError(f"{owner!r} has no {snake(name)!r} (or {name!r})")


def resolve_function(module: ModuleType, meta: dict[str, Any]) -> Callable[..., Any]:
    try:
        return _lookup(module, meta["function"])
    except AttributeError:
        if hasattr(module, "Solution"):  # LeetCode-style class Solution
            return _lookup(module.Solution(), meta["function"])
        raise


def prepare_function(
    fn: Callable[..., Any], meta: dict[str, Any], args: dict[str, Any]
) -> tuple[Callable[[], Any], str]:
    """Convert args outside the timed region; returns (thunk, type of the thunk's result)."""
    params = meta["params"]
    values = [to_py(p["type"], args[p["name"]]) for p in params]
    returns = meta["returns"]

    if returns == "void":
        idx = [p["name"] for p in params].index(meta["output"])
        out_type = params[idx]["type"]

        def run_void() -> Any:
            fn(*values)
            return values[idx]

        return run_void, out_type

    return (lambda: fn(*values)), returns


def run_design(module: ModuleType, meta: dict[str, Any], case: dict[str, Any]) -> list[Any]:
    cls = getattr(module, meta["class"])
    ctor_params = (meta.get("constructor") or {}).get("params", [])
    obj = cls(*[to_py(p["type"], v) for p, v in zip(ctor_params, case.get("ctor", []), strict=True)])
    methods = {m["name"]: m for m in meta["methods"]}
    out = []
    for op, args in zip(case["ops"], case["op_args"], strict=True):
        m = methods[op]
        values = [to_py(p["type"], v) for p, v in zip(m["params"], args, strict=True)]
        out.append(to_json(m["returns"], _lookup(obj, op)(*values)))
    return out


def _short_tb(exc: BaseException) -> str:
    lines = traceback.format_exception(type(exc), exc, exc.__traceback__)
    return "".join(lines[-3:]).strip()


def run_cases(module: ModuleType, meta: dict[str, Any], cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    design = meta["kind"] == "design"
    fn = None if design else resolve_function(module, meta)
    results = []
    for case in cases:
        res: dict[str, Any] = {"name": case["name"], "expected": case["expected"], "ok": False}
        signal.alarm(CASE_TIMEOUT_S)
        try:
            start = time.perf_counter_ns()
            if design:
                got = run_design(module, meta, case)
            else:
                thunk, out_type = prepare_function(fn, meta, case["args"])
                start = time.perf_counter_ns()
                got = to_json(out_type, thunk())
            res["ns"] = time.perf_counter_ns() - start
            res["got"] = normalise(got)
            res["ok"] = compare_case(res["got"], case["expected"], meta["comparator"], design)
        except CaseTimeout as e:
            res["error"] = str(e)
        except Exception as e:  # noqa: BLE001 - report any solution failure
            res["error"] = _short_tb(e)
        finally:
            signal.alarm(0)
        results.append(res)
    return results


def run_bench(module: ModuleType, meta: dict[str, Any], inputs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    fn = resolve_function(module, meta)
    points = []
    for item in inputs:
        samples: list[int] = []
        total = 0
        while total < BENCH_TARGET_S * 1e9 and len(samples) < BENCH_MAX_REPS:
            thunk, _ = prepare_function(fn, meta, item["args"])
            start = time.perf_counter_ns()
            thunk()
            elapsed = time.perf_counter_ns() - start
            samples.append(elapsed)
            total += elapsed
        median = statistics.median(samples)
        points.append({"n": item["n"], "ns": median})
        if median > BENCH_STOP_CALL_S * 1e9:
            break
    return points


def main(argv: list[str]) -> int:
    spec_path, out_path = Path(argv[0]), Path(argv[1])
    spec = json.loads(spec_path.read_text())
    out: dict[str, Any] = {"cases": [], "bench": [], "error": None}
    signal.signal(signal.SIGALRM, _on_alarm)
    try:
        module = load_module(Path(spec["solution"]))
        out["cases"] = run_cases(module, spec["meta"], spec["cases"])
        if spec.get("bench") and all(c["ok"] for c in out["cases"]):
            out["bench"] = run_bench(module, spec["meta"], spec["bench"])
    except Exception as e:  # noqa: BLE001 - load/import errors are reported to the user
        out["error"] = _short_tb(e)
    out_path.write_text(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
