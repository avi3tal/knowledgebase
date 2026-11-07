"""Study sessions: generator, validation, derived scores, lifecycle."""

from __future__ import annotations

import datetime as dt
from typing import Any

import pytest
from kb import history, sessions
from kb.paths import workspace_dir
from kb.schema import ProblemError

TODAY = dt.date(2026, 11, 7)


def run(slug: str, attempt: str, passed: int, total: int = 4, ts: str = "2026-11-07T10:00:00", **kw: Any) -> None:
    history._append(  # noqa: SLF001 - fixed timestamps for determinism
        "runs.jsonl",
        {
            "ts": ts,
            "subject": "algo",
            "slug": slug,
            "attempt": attempt,
            "passed": passed,
            "total": total,
            "error": kw.get("error", False),
            "verdict": kw.get("verdict"),
            "fit": None,
        },
    )


def r(attempt: str, passed: int, total: int = 4, ts: str = "t1", verdict: bool | None = None, error: bool = False):
    return {"attempt": attempt, "passed": passed, "total": total, "ts": ts, "verdict": verdict, "error": error}


@pytest.mark.parametrize(
    "runs, want",
    [
        ([], None),
        ([r("a", 4, verdict=True)], 100),  # all pass, complexity ok, first try
        ([r("a", 4, verdict=None)], 90),  # complexity not measured
        ([r("a", 4, verdict=False)], 80),  # complexity missed
        ([r("a", 2, ts="t1"), r("a", 4, ts="t2", verdict=True)], 90),  # needed a second run
        ([r("a", 0, ts="t1"), r("a", 4, ts="t2", verdict=True)], 100),  # running the red stub first is fine
        ([r("a", 0, ts="t1", error=True), r("a", 4, ts="t2", verdict=True)], 100),
        ([r("a", 2)], 35),  # half the cases
        ([r("a", 0, error=True)], 0),  # crashed
        ([r("a", 1), r("b", 4, verdict=True)], 100),  # best attempt wins
        ([r("a", 4, ts="t1", verdict=True), r("a", 1, ts="t2")], 18),  # latest run of an attempt counts
    ],
)
def test_item_score(runs: list[dict], want: int | None) -> None:
    assert sessions.item_score(runs) == want


def test_generate_is_deterministic_and_respects_scope() -> None:
    kw = {"topics": ["sliding-window", "two-pointers"], "difficulty": ["easy", "medium"], "count": 4, "today": TODAY}
    a, b = sessions.generate(**kw), sessions.generate(**kw)
    assert [i["slug"] for i in a["items"]] == [i["slug"] for i in b["items"]]
    assert len(a["items"]) == 4 and sessions.validate(a) == []
    assert all(i["difficulty"] in ("easy", "medium") for i in a["items"])
    assert {i["topic"] for i in a["items"]} == {"sliding-window", "two-pointers"}  # spread over topics
    ranks = [sessions.DIFF_RANK[i["difficulty"]] for i in a["items"]]
    assert ranks == sorted(ranks)  # easy → hard
    assert {m["topic"] for m in a["materials"]} == {"sliding-window", "two-pointers"}
    other = sessions.generate(**kw, seed="another")
    assert sessions.validate(other) == []


def test_weak_focus_puts_failing_work_first() -> None:
    run("minimum-size-subarray-sum", "2026-11-06_python_sliding-window", passed=1)
    s = sessions.generate(topics=["sliding-window"], count=3, focus="weak", today=TODAY)
    first = next(i for i in s["items"] if i["slug"] == "minimum-size-subarray-sum")
    assert first["why"] == "your latest attempt still fails"
    new = sessions.generate(topics=["sliding-window"], count=3, focus="new", today=TODAY)
    assert "minimum-size-subarray-sum" not in [i["slug"] for i in new["items"]]


@pytest.mark.parametrize(
    "kw, msg",
    [
        ({"subject": "system-design"}, "console exists"),
        ({"topics": ["nope"]}, "unknown topics"),
        ({"focus": "random"}, "focus"),
        ({"count": 0}, "count"),
        ({"difficulty": ["insane"]}, "difficulty"),
    ],
)
def test_generate_rejects_bad_scope(kw: dict, msg: str) -> None:
    with pytest.raises(ProblemError, match=msg):
        sessions.generate(today=TODAY, **kw)


def _plan(**over: Any) -> dict:
    return {
        "title": "Claude plan",
        "focus": "weak",
        "goal": "onsite in 2 weeks",
        "rationale": ["Two pointers is your weakest pattern."],
        "materials": [{"subject": "algo", "topic": "two-pointers"}],
        "items": [{"slug": "three-sum", "why": "core two-pointer drill"}, {"slug": "two-sum"}],
        **over,
    }


@pytest.mark.parametrize(
    "items, msg",
    [
        ([{"slug": "no-such-problem"}], "unknown problem"),
        ([{"slug": "two-sum"}, {"slug": "two-sum"}], "listed twice"),
        ([{"kind": "sd-problem", "subject": "system-design", "slug": "url-shortener"}], "not supported yet"),
        ([{"slug": "two-sum", "id": "Bad Id"}], "kebab-case"),
        ([], "items must be"),
    ],
)
def test_plan_validation(items: list[dict], msg: str) -> None:
    with pytest.raises(ProblemError, match=msg):
        sessions.from_plan(_plan(items=items), today=TODAY)


def test_plan_lifecycle_attempt_and_scores() -> None:
    s = sessions.from_plan(_plan(), today=TODAY)
    assert s["generator"] == "claude" and s["items"][0]["title"] and s["items"][0]["difficulty"]
    sessions.save(s)
    assert (workspace_dir() / "sessions" / s["id"] / "session.json").exists()
    assert (workspace_dir() / "README.md").exists()  # workspace created on first write

    ev = sessions.evaluate(sessions.load(s["id"]))
    assert ev["completion"] == 0 and ev["score"] is None and ev["overall"] == 0
    assert [i["state"] for i in ev["items"]] == ["todo", "todo"]

    adir = sessions.start_attempt(s["id"], "p1", "python")
    assert adir.parent == workspace_dir() / "attempts" / "algo" / "three-sum"
    loaded = sessions.load(s["id"])
    assert loaded["status"] == "active" and loaded["items"][0]["attempts"] == [adir.name]

    (adir / "review.md").write_text("# Review\n**Verdict:** correct")
    from kb import learn

    card = learn.problem_card("algo", "three-sum")
    assert [x["review"] for x in card["attempts"]] == ["# Review\n**Verdict:** correct"]
    assert card["attempts"][0]["path"] == str(adir.resolve())

    run("three-sum", adir.name, passed=4, verdict=True)
    run("three-sum", "2026-01-01_go_unlinked", passed=0)  # not linked: ignored
    ev = sessions.evaluate(sessions.load(s["id"]))
    assert ev["items"][0]["score"] == 100 and ev["items"][0]["state"] == "solved"
    assert ev["completion"] == 0.5 and ev["score"] == 100 and ev["overall"] == 50

    with pytest.raises(ProblemError, match="can't go"):
        sessions.set_status(s["id"], "planned")
    assert sessions.set_status(s["id"], "done")["status"] == "done"
    assert sessions.set_status(s["id"], "active")["status"] == "active"  # resume
    assert [h["status"] for h in sessions.load(s["id"])["history"]] == ["active", "done", "active"]
    assert [x["id"] for x in sessions.all_sessions()] == [s["id"]]


def test_ids_are_unique_and_safe() -> None:
    a = sessions.from_plan(_plan(), today=TODAY)
    sessions.save(a)
    b = sessions.from_plan(_plan(), today=TODAY)
    assert b["id"] == a["id"] + "-2"
    with pytest.raises(ProblemError, match="bad session id"):
        sessions.load("../../etc")


# ------------------------------------------------------------------ studio API


def _call(url: str, body: dict | None = None, headers: dict | None = None) -> tuple[int, Any]:
    import json
    import urllib.error
    import urllib.request

    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data, {"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def test_studio_session_endpoints() -> None:
    import threading

    from kb.server import make_server

    httpd = make_server(0)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        assert _call(f"{base}/api/sessions") == (200, [])
        spec = {"topics": ["two-pointers"], "difficulty": ["easy"], "count": 2, "focus": "new", "goal": "warm-up"}
        status, s = _call(f"{base}/api/sessions", spec)
        assert status == 201 and len(s["items"]) == 2 and s["status"] == "planned"
        assert s["materials"][0]["name"] == "Two Pointers" and s["materials"][0]["has_lesson"] is True

        status, s2 = _call(f"{base}/api/session/{s['id']}/attempt", {"item": "p1", "lang": "python"})
        assert status == 200 and s2["status"] == "active"
        assert s2["items"][0]["state"] == "started" and s2["items"][0]["attempt_paths"][0].startswith(
            str(workspace_dir())
        )
        assert _call(f"{base}/api/session/{s['id']}/status", {"status": "done"})[1]["status"] == "done"
        assert _call(f"{base}/api/session/{s['id']}/status", {"status": "planned"})[0] == 422
        assert _call(f"{base}/api/sessions", {"topics": ["nope"]})[0] == 422
        assert _call(f"{base}/api/session/{s['id']}/attempt", {"item": "p1"})[0] == 400
        assert _call(f"{base}/api/session/no-such")[0] == 404
        forged = _call(f"{base}/api/sessions", spec, {"Origin": "https://evil.example"})
        assert forged[0] == 403 and len(sessions.all_sessions()) == 1
    finally:
        httpd.shutdown()
