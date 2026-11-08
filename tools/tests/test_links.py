"""Problem <-> topic links: the one helper every page and the graph use."""

from __future__ import annotations

import pytest
from kb import learn

ALIASES = {"hashmap": "arrays-hashing", "arrays-hashing": "arrays-hashing", "kafka": "kafka", "caching": "caching"}


@pytest.mark.parametrize(
    ("meta", "want"),
    [
        ({"patterns": ["hashmap", "unknown-tag"]}, [{"id": "arrays-hashing", "role": "pattern"}]),
        ({"patterns": ["hashmap", "arrays-hashing"]}, [{"id": "arrays-hashing", "role": "pattern"}]),
        (
            {"topics": ["caching"], "technologies": ["kafka"], "design_patterns": [], "patterns": ["caching", "kafka"]},
            [{"id": "caching", "role": "topic"}, {"id": "kafka", "role": "technology"}],
        ),
        ({"topics": ["caching"], "technologies": ["caching"]}, [{"id": "caching", "role": "topic"}]),  # first role wins
        ({}, []),
    ],
)
def test_problem_topics(meta: dict, want: list[dict[str, str]]) -> None:
    assert learn.problem_topics(meta, ALIASES) == want


def test_unmapped_tags() -> None:
    assert learn.unmapped_tags({"patterns": ["hashmap", "zzz"]}, ALIASES) == {"zzz"}


def test_similar_problems_ranked_and_deterministic() -> None:
    links = {
        "a": [{"id": "x", "role": "pattern"}, {"id": "y", "role": "pattern"}],
        "b": [{"id": "x", "role": "pattern"}, {"id": "y", "role": "pattern"}],
        "c": [{"id": "x", "role": "pattern"}],
        "d": [{"id": "z", "role": "pattern"}],
        "aa": [{"id": "x", "role": "pattern"}],
    }
    assert learn.similar_problems("a", links) == [("b", 1.0, ["x", "y"]), ("aa", 0.5, ["x"]), ("c", 0.5, ["x"])]
    assert learn.similar_problems("d", links) == []
    assert learn.similar_problems("a", links, limit=1) == [("b", 1.0, ["x", "y"])]


def test_problem_context_algo_and_design() -> None:
    algo = learn.problem_context("algo", "move-zeroes")
    assert {"id": "two-pointers", "role": "pattern", "name": "Two Pointers", "has_lesson": True} in algo["topic_links"]
    assert "remove-element" in {s["slug"] for s in algo["similar"]}
    sd = learn.problem_context("system-design", "news-feed")
    roles = {t["id"]: t["role"] for t in sd["topic_links"]}
    assert roles.get("fan-out") == "pattern" and "technology" in roles.values()
    with pytest.raises(learn.ProblemError):
        learn.problem_context("algo", "no-such-problem")


def test_topic_page_roles_co_topics_and_state() -> None:
    page = learn.topic_page("system-design", "outbox-pattern")  # a pattern with problems but no lesson
    assert page["state"] == "practice-only" and len(page["problems"]) >= 5
    assert {p["role"] for p in page["problems"]} == {"pattern"}
    assert all("outbox-pattern" not in p["other_topics"] for p in page["problems"])
    counts = [c["count"] for c in page["co_topics"]]
    assert counts == sorted(counts, reverse=True)
    assert learn.topic_page("algo", "two-pointers")["state"] == "lesson"


@pytest.mark.parametrize(
    ("lesson", "problems", "resources", "want"),
    [(True, 0, 0, "lesson"), (False, 1, 0, "practice-only"), (False, 0, 2, "practice-only"), (False, 0, 0, "planned")],
)
def test_topic_state(lesson: bool, problems: int, resources: int, want: str) -> None:
    assert learn.topic_state(lesson, problems, resources) == want


def test_topic_counts_match_topic_pages() -> None:
    counts = learn.topic_counts("system-design")
    page = learn.topic_page("system-design", "fan-out")
    assert page["state"] == "lesson"
    assert counts["fan-out"][0] == len(page["problems"])
    assert set(counts) == {t["id"] for t in learn.catalog("system-design")["topics"]}


def test_case_studies_are_problems_not_topics(monkeypatch: pytest.MonkeyPatch) -> None:
    for s in learn.subjects():
        assert all(t["kind"] != "case-study" for t in learn.catalog(s)["topics"]), s
    real = learn.catalog
    monkeypatch.setattr(
        learn,
        "catalog",
        lambda s: {"topics": [{"id": "x", "name": "X", "kind": "case-study"}]} if s == "zz" else real(s),
    )
    assert any("kind must be" in e for e in learn.validate_catalog("zz"))


def test_old_case_study_topic_redirects_to_the_problem() -> None:
    assert learn.topic_page("system-design", "url-shortener") == {
        "subject": "system-design",
        "redirect_problem": "url-shortener",
    }


def test_new_subjects_start_planned() -> None:
    for s in ("genai", "platform"):
        cat = learn.catalog(s)
        assert cat["status"] == "locked" and not learn.validate_catalog(s)
        page = learn.topic_page(s, cat["topics"][0]["id"])
        assert page["problems"] == [] and page["state"] in {"planned", "practice-only"}
    assert learn.topic_page("genai", "rag")["state"] == "practice-only"  # refs moved over from system-design
