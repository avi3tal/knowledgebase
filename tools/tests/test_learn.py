"""Learning layer: traces, lessons, catalog coverage, history, feedback, studio API."""

from __future__ import annotations

import datetime as dt
import json
import threading
import urllib.error
import urllib.request
from collections.abc import Iterator
from pathlib import Path

import pytest
from kb import feedback, history, learn
from kb.paths import ROOT, problems_dir
from kb.trace import TraceError, capture, load_function, validate_view

TESTDATA = Path(__file__).parent / "testdata"
FIXTURE_VIEW = [
    {
        "id": "nums",
        "type": "array",
        "var": "nums",
        "pointers": {"start": "window_start", "end": "window_end"},
        "window": ["window_start", "window_end"],
    },
    {"id": "counts", "type": "map", "var": "counts"},
    {"id": "vars", "type": "vars", "vars": ["total", "sums"]},
]


def fixture_trace() -> dict:
    fn = load_function(TESTDATA / "trace_example.py", "window_sums")
    return capture(fn, {"nums": [1, 2, 2, 3], "k": 2}, FIXTURE_VIEW, title="fixture")


# ------------------------------------------------------------------ traces


def test_trace_matches_shared_fixture() -> None:
    """The same file is consumed by studio/src/trace.test.ts — regenerate both together."""
    assert fixture_trace() == json.loads((TESTDATA / "trace_fixture.json").read_text())


def test_trace_lines_notes_and_states() -> None:
    t = fixture_trace()
    code = t["code"]
    assert code[0].startswith("def window_sums") and not any("# note:" in line for line in code)
    for step in t["steps"]:
        assert 1 <= step["line"] <= len(code)
    noted = [s for s in t["steps"] if s["note"] == "window full"]
    assert noted and all("sums.append" in code[s["line"] - 1] for s in noted)
    # The step after `total += nums[window_end]` shows the updated total.
    add = next(s for s in t["steps"] if s["note"] == "add right element")
    assert add["state"]["vars"]["values"]["total"] == 1
    last = t["steps"][-1]
    assert last["state"]["vars"]["values"]["sums"] == t["result"] == [3, 4, 5]
    assert last["state"]["counts"]["entries"] == [[3, 1]]
    windows = [s["state"]["nums"]["window"] for s in t["steps"] if s["state"]["nums"]["window"]]
    assert [0, 1] in windows and [2, 3] in windows


def test_trace_sanitises_infinity() -> None:
    fn = load_function(ROOT / "algo/learn/sliding-window/examples/max_sum_size_k.py", "max_sum_size_k")
    t = capture(fn, {"nums": [1, 2], "k": 1}, [{"type": "vars", "vars": ["max_sum"]}])
    json.dumps(t, allow_nan=False)  # must not raise
    assert t["steps"][0]["state"]["vars"]["values"]["max_sum"] == "-∞"


def test_trace_step_limit() -> None:
    fn = load_function(TESTDATA / "trace_example.py", "window_sums")
    with pytest.raises(TraceError, match="exceeds"):
        capture(fn, {"nums": list(range(50)), "k": 2}, FIXTURE_VIEW, max_steps=10)


@pytest.mark.parametrize(
    "view, fragment",
    [
        ([], "non-empty"),
        ([{"type": "graph", "var": "g"}], "type must be"),
        ([{"type": "array"}], "needs 'var'"),
        ([{"type": "vars", "vars": "x"}], "'vars' list"),
        ([{"type": "map", "var": "m"}, {"type": "map", "var": "m"}], "duplicate id"),
    ],
)
def test_validate_view(view: list, fragment: str) -> None:
    assert any(fragment in e for e in validate_view(view))


# ------------------------------------------------------------------ lessons & catalog


def test_all_lessons_valid_and_traces_fresh() -> None:
    lessons = [
        (s, t["id"]) for s in learn.subjects() for t in learn.catalog(s)["topics"] if learn.has_lesson(s, t["id"])
    ]
    assert ("algo", "sliding-window") in lessons
    for subject, topic in lessons:
        assert learn.validate(subject, topic) == [], (subject, topic)


def test_catalog_aliases_cover_every_problem_tag() -> None:
    aliases = learn.alias_map(learn.catalog("algo"))
    tags = {t for f in problems_dir().glob("*/meta.json") for t in json.loads(f.read_text())["patterns"]}
    assert tags - set(aliases) == set()


def test_catalog_has_the_23_pdf_patterns_in_order() -> None:
    patterns = [t for t in learn.catalog("algo")["topics"] if t["kind"] == "pattern"]
    assert [t["order"] for t in patterns] == list(range(1, 24))
    assert len({t["id"] for t in learn.catalog("algo")["topics"]}) == len(learn.catalog("algo")["topics"])


def test_resolve_hides_quiz_answers_and_grades() -> None:
    lesson = learn.resolve("algo", "sliding-window")
    quiz = next(b for b in lesson["blocks"] if b["type"] == "quiz")
    assert all(set(item) == {"id", "prompt", "options"} for item in quiz["items"])
    authored = json.loads((ROOT / "algo/learn/sliding-window/quiz.json").read_text())["items"]
    assert [sorted(i["options"]) for i in quiz["items"]] == [sorted(i["options"]) for i in authored]
    assert quiz == next(b for b in learn.resolve("algo", "sliding-window")["blocks"] if b["type"] == "quiz")
    positions = {i["options"].index(a["answer"]) for i, a in zip(quiz["items"], authored, strict=True)}
    assert len(positions) > 1  # the answer isn't always in the same slot
    assert learn.grade_quiz("algo", "sliding-window", "q2", "two-pointers")["correct"] is True
    assert learn.grade_quiz("algo", "sliding-window", "q2", "sliding-window")["correct"] is False


@pytest.mark.parametrize("bad", ["../etc", "Algo", "a/b", ""])
def test_ids_are_validated(bad: str) -> None:
    with pytest.raises(learn.ProblemError):
        learn.lesson_dir("algo", bad)


# ------------------------------------------------------------------ history & feedback


@pytest.fixture
def progress(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setenv("KB_PROGRESS_DIR", str(tmp_path))
    return tmp_path


def _run(slug: str, attempt: str, passed: int, total: int, ts: str, verdict: bool | None = None) -> dict:
    return {
        "ts": ts,
        "subject": "algo",
        "slug": slug,
        "attempt": attempt,
        "lang": "go",
        "passed": passed,
        "total": total,
        "error": False,
        "fit": None,
        "verdict": verdict,
    }


def _write_runs(progress: Path, runs: list[dict]) -> None:
    (progress / "runs.jsonl").write_text("".join(json.dumps(r) + "\n" for r in runs))


def test_feedback_statuses_and_advice(progress: Path) -> None:
    _write_runs(
        progress,
        [
            _run("two-sum", "2020-08-22_python_legacy", 9, 9, "2026-01-01T10:00:00"),
            _run("two-sum", "2026-11-01_go_hashmap", 3, 9, "2026-11-01T10:00:00"),
            _run("two-sum", "2026-11-01_go_hashmap", 9, 9, "2026-11-01T11:00:00", verdict=False),
            _run("same-tree", "2020-11-28_python_legacy", 5, 9, "2026-01-01T10:00:00"),
            _run("valid-anagram", "2026-11-02_go_x", 1, 9, "2026-11-02T10:00:00"),
        ],
    )
    data = feedback.compute("algo", problems_dir(), today=dt.date(2026, 11, 6))
    topics = {t["id"]: t for t in data["topics"]}
    two_sum = next(p for p in topics["two-pointers"]["problems"] if p["slug"] == "two-sum")
    assert two_sum["status"] == "solved" and two_sum["complexity_miss"] is True
    assert any("misses the target complexity" in a for a in topics["two-pointers"]["advice"])
    assert topics["two-pointers"]["review_due"] == "2026-11-02"  # 1 solved → review after 1 day
    dfs = topics["dfs"]
    assert any(p["slug"] == "same-tree" and p["legacy_failing"] for p in dfs["problems"])
    assert any("same-tree" in a for a in dfs["advice"])
    hashing = topics["arrays-hashing"]
    assert any(p["slug"] == "valid-anagram" and p["status"] == "failing" for p in hashing["problems"])
    assert data["unmapped_tags"] == []
    assert "## Two Pointers" in feedback.render_markdown(data)


def test_feedback_quiz_accuracy_uses_latest_answer(progress: Path) -> None:
    for i, (item, ok) in enumerate([("q1", False), ("q1", True), ("q2", False)]):
        history._append(  # noqa: SLF001 - fixed timestamps for determinism
            "quiz.jsonl",
            {"ts": f"2026-11-06T10:00:0{i}", "subject": "algo", "topic": "sliding-window", "item": item, "correct": ok},
        )
    data = feedback.compute("algo", problems_dir(), today=dt.date(2026, 11, 6))
    sw = next(t for t in data["topics"] if t["id"] == "sliding-window")
    assert sw["quiz_accuracy"] == 0.5
    assert any("Recognition is weak" in a for a in sw["advice"])


def test_backfill_from_notes(progress: Path, tmp_path: Path) -> None:
    att = tmp_path / "probs" / "demo" / "attempts" / "2020-01-01_python_legacy"
    att.mkdir(parents=True)
    (att / "solution.py").write_text("")
    (att / "notes.md").write_text("## Runs\n- 2026-11-06 20:48 · 9/9 passed · ≈O(n)\n- 2026-11-06 20:50 · error\n")
    assert history.backfill_from_notes(tmp_path / "probs") == 2
    assert history.backfill_from_notes(tmp_path / "probs") == 0  # idempotent
    runs = history.runs()
    assert runs[0]["passed"] == 9 and runs[0]["fit"] == "O(n)" and runs[1]["error"] is True


# ------------------------------------------------------------------ studio API


@pytest.fixture
def studio(progress: Path) -> Iterator[str]:
    from kb.server import make_server

    httpd = make_server(0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{httpd.server_address[1]}"
    httpd.shutdown()
    httpd.server_close()


def _get(url: str) -> tuple[int, dict]:
    try:
        with urllib.request.urlopen(url) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def test_studio_api(studio: str, progress: Path) -> None:
    status, subjects = _get(f"{studio}/api/subjects")
    assert status == 200 and subjects["root"] == str(ROOT)
    assert any(t["id"] == "sliding-window" and t["has_lesson"] for t in subjects["subjects"][0]["topics"])
    status, lesson = _get(f"{studio}/api/lesson/algo/sliding-window")
    assert status == 200 and [b["type"] for b in lesson["blocks"]].count("trace") == 2
    assert _get(f"{studio}/api/lesson/algo/islands")[0] == 404
    assert _get(f"{studio}/api/lesson/algo/..%2Fsecrets")[0] == 404
    assert _get(f"{studio}/api/problem/algo/two-sum")[1]["slug"] == "two-sum"
    assert _get(f"{studio}/api/feedback/algo")[1]["subject"] == "algo"

    body = json.dumps({"subject": "algo", "topic": "sliding-window", "item": "q1", "choice": "sliding-window"})
    req = urllib.request.Request(f"{studio}/api/quiz", body.encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        assert json.loads(r.read())["correct"] is True
    recorded = history.quiz_answers()
    assert len(recorded) == 1 and recorded[0]["item"] == "q1" and recorded[0]["correct"] is True

    bad = urllib.request.Request(f"{studio}/api/quiz", b'{"subject": "algo"}', {"Content-Type": "application/json"})
    with pytest.raises(urllib.error.HTTPError) as e:
        urllib.request.urlopen(bad)
    assert e.value.code == 400
