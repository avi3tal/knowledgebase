"""Study sessions: a scoped, targeted set of learning materials and practice problems.

A session lives in the learner's private workspace: `<workspace>/sessions/<id>/session.json`.
It stores *what* to study (scope, target, materials, items), the linked attempt names and the
status history. Scores are never stored: they are derived from `progress/runs.jsonl` whenever a
session is read, so re-running an attempt updates the score.

Sessions come from two places, both validated by the same `validate()`:
  - `generate()`: deterministic picks from scope + focus + your history (same inputs → same session);
  - a plan JSON written by Claude (the /session skill) and loaded with `kb session new --plan`.

Status changes only by explicit action: planned → active → done (or abandoned; both can resume).
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from typing import Any

from kb import design, feedback, history, learn, scaffold
from kb.naming import SLUG_RE
from kb.paths import ensure_workspace, problems_dir, workspace_dir
from kb.schema import DIFFICULTIES, ProblemError, load_problem

VERSION = 1
STATUSES = ("planned", "active", "done", "abandoned")
TRANSITIONS = {
    "planned": {"active", "abandoned"},
    "active": {"done", "abandoned"},
    "done": {"active"},
    "abandoned": {"active"},
}
FOCUS = ("weak", "new", "review", "mixed")
GENERATORS = ("kb", "claude")
# Item kind -> subject. Design problems are solved in the studio's design console.
ITEM_KINDS = {"algo-problem": "algo", "sd-problem": "system-design", "ood-problem": "ood"}
KIND_OF = {v: k for k, v in ITEM_KINDS.items()}
MAX_ITEMS = 30
MAX_TEXT = 300
DIFF_RANK = {"easy": 0, "medium": 1, "hard": 2}


# ------------------------------------------------------------------ storage


def sessions_dir() -> Path:
    return workspace_dir() / "sessions"


def _path(session_id: str) -> Path:
    if not SLUG_RE.match(session_id):
        raise ProblemError(f"bad session id {session_id!r} (kebab-case expected)")
    return sessions_dir() / session_id / "session.json"


def load(session_id: str) -> dict[str, Any]:
    path = _path(session_id)
    if not path.exists():
        raise ProblemError(f"no session {session_id!r}")
    return json.loads(path.read_text())


def save(session: dict[str, Any]) -> Path:
    errors = validate(session)
    if errors:
        raise ProblemError("invalid session:\n  - " + "\n  - ".join(errors))
    ensure_workspace()
    path = _path(session["id"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(session, indent=2, ensure_ascii=False) + "\n")
    return path


def all_sessions() -> list[dict[str, Any]]:
    root = sessions_dir()
    if not root.is_dir():
        return []
    out = []
    for p in sorted(root.glob("*/session.json")):
        try:
            out.append(json.loads(p.read_text()))
        except json.JSONDecodeError:
            continue
    return sorted(out, key=lambda s: s.get("created", ""), reverse=True)


def new_id(title: str, today: dt.date) -> str:
    base = f"{today.isoformat()}-{re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:40].strip('-') or 'session'}"
    sid, i = base, 2
    while (sessions_dir() / sid).exists():
        sid, i = f"{base}-{i}", i + 1
    return sid


# ------------------------------------------------------------------ validation


def _text(v: Any) -> bool:
    return isinstance(v, str) and 0 < len(v) <= MAX_TEXT


def validate(s: Any) -> list[str]:
    if not isinstance(s, dict):
        return ["session must be an object"]
    e: list[str] = []
    if s.get("version") != VERSION:
        e.append(f"version must be {VERSION}")
    if not isinstance(s.get("id"), str) or not SLUG_RE.match(s["id"]):
        e.append("id must be kebab-case")
    if not _text(s.get("title")):
        e.append(f"title must be 1..{MAX_TEXT} chars")
    if s.get("generator") not in GENERATORS:
        e.append(f"generator must be one of {GENERATORS}")
    if s.get("status") not in STATUSES:
        e.append(f"status must be one of {STATUSES}")
    target = s.get("target", {})
    if not isinstance(target, dict) or target.get("focus") not in FOCUS:
        e.append(f"target.focus must be one of {FOCUS}")
    elif target.get("goal") is not None and not _text(target["goal"]):
        e.append("target.goal must be short text")
    if not all(_text(r) for r in s.get("rationale", [])):
        e.append("rationale must be a list of short strings")

    subjects = set(learn.subjects())
    for i, m in enumerate(s.get("materials", [])):
        if not isinstance(m, dict) or m.get("subject") not in subjects:
            e.append(f"materials[{i}]: unknown subject")
        elif m.get("topic") not in learn.topic_ids(learn.catalog(m["subject"])):
            e.append(f"materials[{i}]: unknown topic {m.get('topic')!r}")

    items = s.get("items")
    if not isinstance(items, list) or not 0 < len(items) <= MAX_ITEMS:
        e.append(f"items must be a list of 1..{MAX_ITEMS}")
        return e
    seen_ids, seen_refs = set(), set()
    for i, it in enumerate(items):
        where = f"items[{i}]"
        if not isinstance(it, dict):
            e.append(f"{where} must be an object")
            continue
        if not isinstance(it.get("id"), str) or not SLUG_RE.match(it["id"]) or it["id"] in seen_ids:
            e.append(f"{where}.id must be unique kebab-case")
        seen_ids.add(it.get("id"))
        kind = it.get("kind")
        if kind not in ITEM_KINDS:
            e.append(f"{where}.kind {kind!r} not supported yet (have: {sorted(ITEM_KINDS)})")
            continue
        if it.get("subject") != ITEM_KINDS[kind]:
            e.append(f"{where}.subject must be {ITEM_KINDS[kind]!r} for {kind}")
            continue
        slug = it.get("slug")
        if not isinstance(slug, str) or not SLUG_RE.match(slug) or not (problems_dir(it["subject"]) / slug).is_dir():
            e.append(f"{where}: unknown problem {slug!r}")
        elif (it["subject"], slug) in seen_refs:
            e.append(f"{where}: {slug} is listed twice")
        seen_refs.add((it["subject"], slug))
        if it.get("why") is not None and not _text(it["why"]):
            e.append(f"{where}.why must be short text")
        if not isinstance(it.get("attempts", []), list) or not all(
            isinstance(a, str) and re.match(r"^\d{4}-\d{2}-\d{2}_[a-z]+_[a-z0-9-]+$", a) for a in it.get("attempts", [])
        ):
            e.append(f"{where}.attempts must be attempt dir names")
    return e


# ------------------------------------------------------------------ scoring (derived, never stored)


def item_score(item_runs: list[dict[str, Any]]) -> int | None:
    """Score 0..100 of one item from the runs of its linked attempts (None = not attempted yet).

    Best attempt wins. Per attempt, its *latest* run counts:
      correctness  70 × passed/total   (an error run scores 0)
      complexity   +20 if all passed and the measured complexity matches, +10 if not measured, 0 if missed
      first try    +10 if the first run that passed any case already passed everything
                   (runs of the untouched stub, 0 passed, don't count: red → green is fine)
    """
    if not item_runs:
        return None
    by_attempt: dict[str, list[dict[str, Any]]] = {}
    for r in sorted(item_runs, key=lambda r: r["ts"]):
        by_attempt.setdefault(r["attempt"], []).append(r)
    best = 0
    for runs in by_attempt.values():
        last = runs[-1]
        if last.get("error") or not last.get("total"):
            continue
        score = 70 * last["passed"] / last["total"]
        if last["passed"] == last["total"]:
            score += {True: 20, None: 10, False: 0}[last.get("verdict")]
            first_real = next((x for x in runs if not x.get("error") and x.get("passed", 0) > 0), None)
            if feedback._passed(first_real):  # noqa: SLF001 - shared definition of "passed"
                score += 10
        best = max(best, round(score))
    return best


def evaluate(session: dict[str, Any], runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """The session plus derived per-item results, completion and score."""
    runs = history.runs() if runs is None else runs
    items = []
    for it in session["items"]:
        linked = set(it.get("attempts", []))
        mine = [r for r in runs if r.get("slug") == it["slug"] and r.get("attempt") in linked]
        score = item_score(mine)
        last = max(mine, key=lambda r: r["ts"]) if mine else None
        state = "todo" if not linked else "started" if score is None else "solved" if score >= 90 else "attempted"
        items.append({**it, "score": score, "state": state, "last_run": last})
    scored = [i["score"] for i in items if i["score"] is not None]
    return {
        **session,
        "items": items,
        "completion": round(len(scored) / len(items), 2),
        "score": round(sum(scored) / len(scored)) if scored else None,
        "overall": round(sum(scored) / len(items)),  # unattempted items count as 0
    }


# ------------------------------------------------------------------ lifecycle


def set_status(session_id: str, status: str, now: str | None = None) -> dict[str, Any]:
    s = load(session_id)
    if status not in TRANSITIONS.get(s["status"], set()):
        raise ProblemError(f"can't go from {s['status']} to {status}")
    s["status"] = status
    s.setdefault("history", []).append({"ts": now or history.now(), "status": status})
    save(s)
    return s


def start_attempt(session_id: str, item_id: str, lang: str, pattern: str | None = None) -> Path:
    """Create a fresh attempt for one item and link it to the session (starts a planned session)."""
    s = load(session_id)
    item = next((i for i in s["items"] if i["id"] == item_id), None)
    if item is None:
        raise ProblemError(f"session {session_id} has no item {item_id!r}")
    if design.is_design_subject(item["subject"]):
        adir = design.new_attempt(design.load(item["subject"], item["slug"]), pattern or None)
    else:
        problem = load_problem(problems_dir(item["subject"]) / item["slug"])
        adir = scaffold.new_attempt(problem, lang, pattern or item.get("topic"))
    item.setdefault("attempts", []).append(adir.name)
    if s["status"] == "planned":
        s["status"] = "active"
        s.setdefault("history", []).append({"ts": history.now(), "status": "active"})
    save(s)
    return adir


# ------------------------------------------------------------------ deterministic generator


def _tiebreak(seed: str, slug: str) -> str:
    return hashlib.sha256(f"{seed}:{slug}".encode()).hexdigest()


def generate(
    subject: str = "algo",
    topics: list[str] | None = None,
    difficulty: list[str] | None = None,
    count: int = 5,
    focus: str = "mixed",
    goal: str | None = None,
    title: str | None = None,
    minutes: int | None = None,
    seed: str | None = None,
    today: dt.date | None = None,
) -> dict[str, Any]:
    """Pick `count` problems for a scope and focus from your history. Pure given (inputs, runs, catalog)."""
    today = today or dt.date.today()
    if subject not in KIND_OF:
        raise ProblemError(f"no session support for {subject!r}; have: {', '.join(sorted(KIND_OF))}")
    if focus not in FOCUS:
        raise ProblemError(f"focus must be one of {FOCUS}")
    if not 1 <= count <= MAX_ITEMS:
        raise ProblemError(f"count must be 1..{MAX_ITEMS}")
    cat = learn.catalog(subject)
    known = learn.topic_ids(cat)
    topics = topics or []
    bad = [t for t in topics if t not in known]
    if bad:
        raise ProblemError(f"unknown topics: {', '.join(bad)}")
    difficulty = difficulty or []
    if any(d not in DIFFICULTIES for d in difficulty):
        raise ProblemError(f"difficulty must be from {sorted(DIFFICULTIES)}")

    fb = feedback.compute(subject, problems_dir(subject), today=today)
    topic_state = {t["id"]: t for t in fb["topics"]}
    aliases = learn.alias_map(cat)
    runs = [r for r in history.runs() if r.get("subject", subject) == subject]
    seed = seed or today.isoformat()

    candidates = []
    for p in learn.subject_problems(subject, problems_dir(subject)):
        ptopics = sorted({aliases[t] for t in p.meta.get("patterns", []) if t in aliases})
        if topics and not set(ptopics) & set(topics):
            continue
        if difficulty and p.meta.get("difficulty") not in difficulty:
            continue
        st = feedback.problem_status(p, runs)
        main = next((t for t in ptopics if t in topics), ptopics[0] if ptopics else None)
        candidates.append({"problem": p, "status": st, "topic": main})
    if not candidates:
        raise ProblemError("no problems match this scope")

    def due(c: dict[str, Any]) -> bool:
        t = topic_state.get(c["topic"] or "", {})
        return bool(t.get("review_due")) and t["review_due"] <= today.isoformat()

    def reason(c: dict[str, Any]) -> tuple[int, str]:
        """(bucket for the focus, why) — lower bucket = picked first."""
        st = c["status"]
        weak = {
            "failing": (0, "your latest attempt still fails"),
            "solved": (4, "solved before: re-solve from scratch"),
        }
        if focus == "weak":
            if st["status"] == "failing":
                return weak["failing"]
            if st["complexity_miss"]:
                return 1, "passes but missed the target complexity"
            if st["legacy_failing"]:
                return 2, "an old solution of yours has a known bug"
            return (3, "untried in a topic you're building") if st["status"] == "untried" else weak["solved"]
        if focus == "review":
            if st["status"] == "solved" and due(c):
                return 0, "spaced review is due for this topic"
            if st["status"] == "solved":
                return 1, "solved before: re-solve from scratch"
            return 2, "keeps the topic fresh"
        if focus == "new":
            return (0, "new to you") if st["status"] == "untried" and not st["legacy_failing"] else (1, "seen before")
        # mixed: weak first, then due reviews, then new
        if st["status"] == "failing" or st["complexity_miss"]:
            return 0, "your latest attempt still fails" if st["status"] == "failing" else "missed target complexity"
        if st["status"] == "solved" and due(c):
            return 1, "spaced review is due for this topic"
        if st["status"] == "untried":
            return 2, "new to you"
        return 3, "solved before: re-solve from scratch"

    ranked = sorted(
        candidates,
        key=lambda c: (
            reason(c)[0],
            DIFF_RANK.get(c["status"]["difficulty"] or "", 9),
            _tiebreak(seed, c["problem"].slug),
        ),
    )
    # Spread over topics: round-robin by topic in rank order, so one topic doesn't take every slot.
    picked: list[dict[str, Any]] = []
    queues: dict[str | None, list[dict[str, Any]]] = {}
    for c in ranked:
        queues.setdefault(c["topic"], []).append(c)
    while len(picked) < count and any(queues.values()):
        for q in list(queues.values()):
            if q and len(picked) < count:
                picked.append(q.pop(0))
    picked.sort(key=lambda c: (DIFF_RANK.get(c["status"]["difficulty"] or "", 9), reason(c)[0]))

    names = {t["id"]: t["name"] for t in cat["topics"]}
    chosen_topics = list(dict.fromkeys(c["topic"] for c in picked if c["topic"]))
    title = title or (
        f"{' + '.join(names[t] for t in (topics or chosen_topics)[:3])} · {focus}"
        if (topics or chosen_topics)
        else focus
    )
    materials = [
        {"subject": subject, "topic": t, "why": "lesson + quiz before the problems"}
        for t in chosen_topics
        if learn.has_lesson(subject, t)
    ][:6]
    weak_topics = [
        names[t]
        for t in chosen_topics
        if (topic_state.get(t, {}).get("quiz_accuracy") is not None and topic_state[t]["quiz_accuracy"] < 0.8)
    ]
    rationale = [
        f"Focus: {focus}; {len(candidates)} problems in scope, {len(picked)} picked across "
        f"{len(chosen_topics)} topics, easy → hard."
    ]
    if weak_topics:
        rationale.append("Quiz recognition is weak in: " + ", ".join(weak_topics[:4]) + ".")
    return {
        "version": VERSION,
        "id": new_id(title, today),
        "title": title[:MAX_TEXT],
        "created": history.now(),
        "generator": "kb",
        "scope": {"subject": subject, "topics": topics, "difficulty": difficulty, "count": count, "minutes": minutes},
        "target": {"focus": focus, "goal": goal},
        "rationale": rationale,
        "status": "planned",
        "history": [],
        "materials": materials,
        "items": [
            {
                "id": f"p{i + 1}",
                "kind": KIND_OF[subject],
                "subject": subject,
                "slug": c["problem"].slug,
                "title": c["problem"].meta.get("title", c["problem"].slug),
                "difficulty": c["status"]["difficulty"],
                "topic": c["topic"],
                "why": reason(c)[1],
                "attempts": [],
            }
            for i, c in enumerate(picked)
        ],
    }


def from_plan(plan: dict[str, Any], today: dt.date | None = None) -> dict[str, Any]:
    """A session from a plan (e.g. written by Claude's /session skill); kb fills ids and bookkeeping."""
    today = today or dt.date.today()
    title = str(plan.get("title") or "Study session")
    items = []
    for i, it in enumerate(plan.get("items", [])):
        it = dict(it)
        it.setdefault("id", f"p{i + 1}")
        it.setdefault("subject", "algo")
        it.setdefault("kind", KIND_OF.get(it["subject"], "algo-problem"))
        it["attempts"] = []
        pdir = problems_dir(it["subject"]) / str(it.get("slug", ""))
        if pdir.is_dir():
            meta = json.loads((pdir / "meta.json").read_text())
            it.setdefault("title", meta.get("title"))
            it.setdefault("difficulty", meta.get("difficulty"))
        items.append(it)
    session = {
        "version": VERSION,
        "id": new_id(title, today),
        "title": title[:MAX_TEXT],
        "created": history.now(),
        "generator": "claude",
        "scope": plan.get("scope", {}),
        "target": {"focus": plan.get("focus", "mixed"), "goal": plan.get("goal")},
        "rationale": plan.get("rationale", []),
        "status": "planned",
        "history": [],
        "materials": plan.get("materials", []),
        "items": items,
    }
    errors = validate(session)
    if errors:
        raise ProblemError("invalid plan:\n  - " + "\n  - ".join(errors))
    return session
