"""End-to-end: validate fixtures, run every attempt (Python + Go), scaffold new problems."""

from __future__ import annotations

import json
import shutil
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from kb import runner, scaffold
from kb.complexity import matches
from kb.schema import ProblemError, load_problem, validate

FIXTURES = Path(__file__).parent / "testdata" / "problems"
PROBLEMS = sorted(p for p in FIXTURES.iterdir() if p.is_dir())
ATTEMPTS = [(p.name, a.name) for p in PROBLEMS for a in sorted((p / "attempts").iterdir()) if a.is_dir()]


@pytest.mark.parametrize("problem_dir", PROBLEMS, ids=lambda p: p.name)
def test_fixtures_valid(problem_dir: Path) -> None:
    assert validate(load_problem(problem_dir)) == []


@pytest.mark.parametrize("slug, attempt", ATTEMPTS, ids=[f"{s}/{a}" for s, a in ATTEMPTS])
def test_fixture_attempts_pass(slug: str, attempt: str) -> None:
    problem = load_problem(FIXTURES / slug)
    res = runner.run(problem, problem.attempts_dir / attempt, bench=False)
    assert res.error is None
    assert res.all_passed, res.cases


@pytest.mark.parametrize(
    "attempt, consistent",
    [("2026-11-06_go_hashmap", True), ("2026-11-06_python_hashmap", True), ("2026-11-06_python_brute-force", False)],
)
def test_complexity_verdict(attempt: str, consistent: bool) -> None:
    problem = load_problem(FIXTURES / "two-sum")
    if not consistent:  # keep the O(n^2) run short
        problem.meta["bench"] = {**problem.meta["bench"], "max_n": 4096}
    res = runner.run(problem, problem.attempts_dir / attempt, bench=True)
    assert res.all_passed
    fit = res.fit
    assert fit is not None
    assert matches(fit, problem.meta["expected_complexity"]["time"], [p["n"] for p in res.bench]) is consistent


@pytest.mark.parametrize("attempt", ["2026-11-06_python_naive", "2026-11-06_go_naive"])
def test_exponential_bench_stops_within_budget(attempt: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("KB_CALL_BUDGET_S", "1")
    problem = load_problem(FIXTURES / "fibonacci")
    res = runner.run(problem, problem.attempts_dir / attempt, bench=True)
    assert res.all_passed and res.error is None
    # Either the per-call budget or the "calls got slow" rule stops it; both must say so.
    assert res.bench_note and "stopped" in res.bench_note
    assert [p["n"] for p in res.bench][:2] == [20, 24]  # points before the budget hit are kept


def test_recursion_error_in_bench_keeps_cases_green() -> None:
    problem = load_problem(FIXTURES / "reverse-linked-list")
    res = runner.run(problem, problem.attempts_dir / "2026-11-06_python_recursive", bench=True)
    assert res.all_passed and res.error is None
    assert res.bench_note and "RecursionError" in res.bench_note
    assert res.bench  # sizes below the recursion limit were measured


def test_skeleton_fails_validation(scratch: Path) -> None:
    errors = validate(load_problem(scaffold.new_problem(scratch, "skeleton")))
    joined = "\n".join(errors)
    assert "'?' placeholder" in joined and "'todo' placeholder" in joined and "README.md still has" in joined


@pytest.fixture
def scratch() -> Iterator[Path]:
    """Problems dir inside the Go module (Go attempts must live under go.mod)."""
    path = Path(__file__).parent / "testdata" / f"scratch-{uuid.uuid4().hex[:8]}"
    path.mkdir()
    yield path
    shutil.rmtree(path)


def test_new_refuses_overwrite_and_bad_slug(scratch: Path) -> None:
    scaffold.new_problem(scratch, "my-problem")
    with pytest.raises(ProblemError):
        scaffold.new_problem(scratch, "my-problem")
    with pytest.raises(ProblemError):
        scaffold.new_problem(scratch, "Bad_Slug")


def test_attempt_requires_valid_meta(scratch: Path) -> None:
    pdir = scratch / "broken"
    shutil.copytree(FIXTURES / "two-sum", pdir, ignore=shutil.ignore_patterns("attempts"))
    (pdir / "cases.json").write_text("[]")
    with pytest.raises(ProblemError, match="cases.json is empty"):
        scaffold.new_attempt(load_problem(pdir), "python")


@pytest.mark.parametrize("fixture", [p.name for p in PROBLEMS])
@pytest.mark.parametrize("lang", ["python", "go"])
def test_generated_stubs_build_and_fail_cleanly(scratch: Path, fixture: str, lang: str) -> None:
    """Fresh stubs for every signature shape compile/import and fail cases (not crash the runner)."""
    pdir = scratch / fixture
    shutil.copytree(FIXTURES / fixture, pdir, ignore=shutil.ignore_patterns("attempts"))
    problem = load_problem(pdir)
    adir = scaffold.new_attempt(problem, lang, "stub")
    assert adir.name.endswith(f"_{lang}_stub")
    again = scaffold.new_attempt(problem, lang, "stub")
    assert again.name.endswith("_stub-2")
    res = runner.run(problem, adir, bench=False)
    assert res.error is None, res.error
    assert len(res.cases) == len(problem.cases)
    if fixture != "sort-in-place":  # a no-op "sort" happens to pass the empty case only
        assert not res.all_passed


@pytest.mark.parametrize("pattern", ["design.", "Two Pointers", "a/b"])
def test_attempt_rejects_bad_pattern(scratch: Path, pattern: str) -> None:
    pdir = scratch / "two-sum"
    shutil.copytree(FIXTURES / "two-sum", pdir, ignore=shutil.ignore_patterns("attempts"))
    with pytest.raises(ProblemError, match="kebab-case"):
        scaffold.new_attempt(load_problem(pdir), "go", pattern)


def test_index(scratch: Path) -> None:
    for p in PROBLEMS:
        shutil.copytree(p, scratch / p.name)
    index = scaffold.build_index(scratch)
    assert "### heap" in index and "[Two Sum](two-sum/README.md)" in index
    assert "3 (go, python)" in index


def test_cli_run_logs_to_notes(scratch: Path, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
    from kb.cli import main

    shutil.copytree(FIXTURES / "two-sum", scratch / "two-sum")
    monkeypatch.setenv("KB_PROBLEMS_DIR", str(scratch))
    assert main(["run", "two-sum", "go_hashmap", "--no-bench"]) == 0
    assert "4/4 passed" in capsys.readouterr().out
    notes = (scratch / "two-sum/attempts/2026-11-06_go_hashmap/notes.md").read_text()
    assert "4/4 passed" in notes.splitlines()[-1]
    assert main(["validate", "two-sum"]) == 0
    meta = json.loads((scratch / "two-sum/meta.json").read_text())
    meta["comparator"] = "bogus"
    (scratch / "two-sum/meta.json").write_text(json.dumps(meta))
    assert main(["validate", "two-sum"]) == 1
