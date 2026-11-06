"""Deterministic progress feedback per catalog topic (no AI): what's solved, what's weak, what next.

Status of a problem (practice attempts = anything not named *_legacy*):
  solved    latest run of some practice attempt passed every case
  failing   practice attempts exist but none passes on its latest run
  untried   no practice attempt run yet
Legacy attempts are reported separately: a failing legacy attempt is a known bug from the past.
"""

from __future__ import annotations

import datetime as dt
from collections import defaultdict
from pathlib import Path
from typing import Any

from kb import history, learn, scaffold
from kb.schema import Problem

REVIEW_AFTER_DAYS = [1, 3, 7, 14, 30]  # spaced repetition by number of successful sessions
QUIZ_TARGET = 0.8


def _latest(runs: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for r in sorted(runs, key=lambda r: r["ts"]):
        out[r["attempt"]] = r
    return out


def _passed(r: dict[str, Any] | None) -> bool:
    return bool(r) and not r.get("error") and r.get("total", 0) > 0 and r["passed"] == r["total"]


def problem_status(problem: Problem, runs: list[dict[str, Any]]) -> dict[str, Any]:
    latest = _latest([r for r in runs if r.get("slug") == problem.slug])
    practice = {a: r for a, r in latest.items() if not history.is_legacy(a)}
    legacy = {a: r for a, r in latest.items() if history.is_legacy(a)}
    if any(_passed(r) for r in practice.values()):
        status = "solved"
    elif practice:
        status = "failing"
    else:
        status = "untried"
    passing = [r for r in practice.values() if _passed(r)]
    return {
        "slug": problem.slug,
        "title": problem.meta.get("title", problem.slug),
        "difficulty": problem.meta.get("difficulty"),
        "status": status,
        "complexity_miss": any(r.get("verdict") is False for r in passing),
        "legacy_failing": any(not _passed(r) for r in legacy.values()),
        "sessions": sum(1 for r in runs if r.get("slug") == problem.slug and not history.is_legacy(r["attempt"])),
        "last_practiced": max(
            (r["ts"] for r in runs if r.get("slug") == problem.slug and not r.get("backfilled")), default=None
        ),
    }


def _next_review(successes: int, last: str | None, today: dt.date) -> dt.date | None:
    if not last or successes == 0:
        return None
    gap = REVIEW_AFTER_DAYS[min(successes, len(REVIEW_AFTER_DAYS)) - 1]
    return dt.date.fromisoformat(last[:10]) + dt.timedelta(days=gap)


def compute(subject: str, problems_dir: Path, today: dt.date | None = None) -> dict[str, Any]:
    today = today or dt.date.today()
    cat = learn.catalog(subject)
    aliases = learn.alias_map(cat)
    runs = [r for r in history.runs() if r.get("subject", subject) == subject]
    quiz = [q for q in history.quiz_answers() if q.get("subject") == subject]

    by_topic: dict[str, list[dict[str, Any]]] = defaultdict(list)
    unmapped: set[str] = set()
    for p in scaffold.all_problems(problems_dir):
        st = problem_status(p, runs)
        for tag in p.meta.get("patterns", []):
            if tag in aliases:
                by_topic[aliases[tag]].append(st)
            else:
                unmapped.add(tag)

    topics = []
    for t in cat["topics"]:
        probs = by_topic.get(t["id"], [])
        answers = [q for q in quiz if q.get("topic") == t["id"]]
        # Latest answer per item counts, so re-taking the quiz can raise the score.
        last_answer = {q["item"]: q for q in sorted(answers, key=lambda q: q["ts"])}
        accuracy = (sum(1 for q in last_answer.values() if q["correct"]) / len(last_answer)) if last_answer else None
        solved = [p for p in probs if p["status"] == "solved"]
        last = max((p["last_practiced"] for p in probs if p["last_practiced"]), default=None)
        review = _next_review(len(solved), last, today)
        topics.append(
            {
                "id": t["id"],
                "name": t["name"],
                "kind": t["kind"],
                "has_lesson": learn.has_lesson(subject, t["id"]),
                "problems": probs,
                "counts": {s: sum(1 for p in probs if p["status"] == s) for s in ("solved", "failing", "untried")},
                "quiz_accuracy": accuracy,
                "last_practiced": last,
                "review_due": review.isoformat() if review else None,
                "advice": _advice(t, probs, accuracy, review, today, learn.has_lesson(subject, t["id"])),
            }
        )
    return {"subject": subject, "today": today.isoformat(), "topics": topics, "unmapped_tags": sorted(unmapped)}


def _advice(
    topic: dict[str, Any],
    probs: list[dict[str, Any]],
    accuracy: float | None,
    review: dt.date | None,
    today: dt.date,
    has_lesson: bool,
) -> list[str]:
    tips: list[str] = []
    if accuracy is not None and accuracy < QUIZ_TARGET:
        tips.append(
            f"Recognition is weak ({accuracy:.0%} on the quiz): redo the lesson's 'how to recognise it' + quiz."
        )
    for p in probs:
        if p["status"] == "failing":
            tips.append(f"Finish {p['slug']}: your latest attempt still fails cases.")
        if p["complexity_miss"]:
            tips.append(f"{p['slug']} passes but misses the target complexity: revisit the pattern template.")
    legacy_bugs = [p["slug"] for p in probs if p["legacy_failing"] and p["status"] != "solved"]
    if legacy_bugs:
        tips.append("Old solutions with known bugs, good re-practice: " + ", ".join(legacy_bugs[:4]))
    if review and review <= today:
        tips.append(f"Spaced review due since {review.isoformat()}: solve one problem again from scratch.")
    untried = [p["slug"] for p in probs if p["status"] == "untried" and not p["legacy_failing"]]
    if untried and not any(p["status"] == "failing" for p in probs):
        tips.append("Next up: " + ", ".join(untried[:3]))
    if not probs and topic["kind"] == "pattern":
        tips.append(
            "No problems yet" + (" — open the lesson." if has_lesson else " — ask Claude: /learn algo " + topic["id"])
        )
    return tips


def render_markdown(data: dict[str, Any], only: str | None = None) -> str:
    lines = [f"# Feedback — {data['subject']} ({data['today']})", ""]
    for t in data["topics"]:
        if only and t["id"] != only:
            continue
        if not t["problems"] and not t["advice"] and t["quiz_accuracy"] is None:
            continue
        c = t["counts"]
        quiz = "—" if t["quiz_accuracy"] is None else f"{t['quiz_accuracy']:.0%}"
        lines.append(
            f"## {t['name']}  ·  solved {c['solved']} / failing {c['failing']} / untried {c['untried']}  ·  quiz {quiz}"
        )
        lines += [f"- {tip}" for tip in t["advice"]] or ["- On track."]
        lines.append("")
    if data["unmapped_tags"]:
        lines.append("Unmapped problem tags (add them as catalog aliases): " + ", ".join(data["unmapped_tags"]))
    return "\n".join(lines).rstrip() + "\n"
