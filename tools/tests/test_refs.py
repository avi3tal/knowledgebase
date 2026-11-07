"""Source registry, research refs, catalogs and the knowledge graph."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest
from kb import learn, refs
from kb.paths import ROOT, problems_dir
from kb.schema import load_problem, validate

GOOD_REF = {
    "id": "sw-lesson",
    "title": "Sliding Window",
    "url": "https://example.dev/sliding-window",
    "kind": "lesson",
    "access": "free",
    "subject": "algo",
    "topics": ["sliding-window"],
    "summary": "A clear animated intro to fixed and variable windows.",
    "quality": 4,
}


@pytest.fixture
def res(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """A private copy of resources/ (registry only, no refs) that refs.* reads from."""
    root = tmp_path / "resources"
    (root / "refs").mkdir(parents=True)
    shutil.copy(ROOT / "resources" / "sources.json", root / "sources.json")
    monkeypatch.setattr(refs, "resources_dir", lambda: root)
    return root


def write_refs(res: Path, source: str, items: list[dict], name: str | None = None) -> Path:
    path = res / "refs" / f"{name or source}.json"
    path.write_text(json.dumps({"version": 1, "source": source, "refs": items}))
    return path


def test_real_registry_catalogs_and_refs_are_valid() -> None:
    assert all(errors == [] for errors in refs.validate_all().values()), refs.validate_all()
    for subject in learn.subjects():
        assert learn.validate_catalog(subject) == [], subject
    assert {"algo", "system-design", "ood"} <= set(learn.subjects())


def test_every_problem_source_tag_resolves() -> None:
    index = refs.source_index()
    for meta in problems_dir().glob("*/meta.json"):
        for s in json.loads(meta.read_text()).get("sources", []):
            assert refs.resolves(s["name"], index), (meta.parent.name, s["name"])


def test_unknown_problem_source_fails_validation(tmp_path: Path) -> None:
    pdir = tmp_path / "two-sum"
    shutil.copytree(ROOT / "tools/tests/testdata/problems/two-sum", pdir, ignore=shutil.ignore_patterns("attempts"))
    meta = json.loads((pdir / "meta.json").read_text())
    meta["sources"] = [{"name": "some-random-site"}]
    (pdir / "meta.json").write_text(json.dumps(meta))
    assert any("not in resources/sources.json" in e for e in validate(load_problem(pdir)))
    meta["sources"] = [{"name": "interview:acme"}, {"name": "careercup"}]  # prefix rule + alias
    (pdir / "meta.json").write_text(json.dumps(meta))
    assert not any("sources.json" in e for e in validate(load_problem(pdir)))


@pytest.mark.parametrize(
    "patch, fragment",
    [
        ({"topics": ["no-such-topic"]}, "unknown algo topics"),
        ({"subject": "biology"}, "unknown subject"),
        ({"url": "https://x.dev/a?aff=123"}, "affiliate"),
        ({"url": None, "page": None}, "needs a url"),
        ({"kind": "tweet"}, "kind must be"),
        ({"access": "pirated"}, "access must be"),
        ({"summary": "x" * 300}, "summary"),
        ({"quality": 9}, "quality"),
        ({"topics": [], "problem_title": None}, "needs topics"),
    ],
)
def test_ref_validation_errors(res: Path, patch: dict, fragment: str) -> None:
    ref = {**GOOD_REF, **patch}
    ref = {k: v for k, v in ref.items() if v is not None}
    path = write_refs(res, "algomaster", [ref])
    assert any(fragment in e for e in refs.validate_refs_file(path)), refs.validate_refs_file(path)


def test_ref_file_level_rules(res: Path) -> None:
    assert refs.validate_refs_file(write_refs(res, "algomaster", [GOOD_REF])) == []
    dup = write_refs(res, "algomaster", [GOOD_REF, {**GOOD_REF, "id": "other"}])
    assert any("duplicate url" in e for e in refs.validate_refs_file(dup))
    wrong_name = write_refs(res, "algomaster", [GOOD_REF], name="something-else")
    assert any("file name" in e for e in refs.validate_refs_file(wrong_name))
    unknown = write_refs(res, "nobody", [GOOD_REF])
    assert any("unknown source" in e for e in refs.validate_refs_file(unknown))
    book = {**GOOD_REF, "id": "p", "url": None, "page": 12, "access": "local"}
    book = {k: v for k, v in book.items() if v is not None}
    assert refs.validate_refs_file(write_refs(res, "leetcode-solutions-book", [book])) == []


@pytest.mark.parametrize(
    "title, slug",
    [
        ("Two Sum", "two-sum"),
        ("1. Two Sum", "two-sum"),
        ("LeetCode 23 - Merge k Sorted Lists", "merge-k-sorted-lists"),
        ("merge-two-sorted-lists", "merge-two-sorted-lists"),
        ("Some Problem We Do Not Have", None),
        (None, None),
    ],
)
def test_problem_title_matching(title: str | None, slug: str | None) -> None:
    assert refs.match_problem(title, refs.title_index()) == slug


def test_lookups_rank_core_first_and_hide_skipped(res: Path) -> None:
    reg = json.loads((res / "sources.json").read_text())
    verdicts = {"algomaster": "supplementary", "bytebytego": "core", "algomonster": "skip"}
    for s in reg["sources"]:
        s.pop("subject_verdicts", None)
        if s["id"] in verdicts:
            s["verdict"], s["reason"] = verdicts[s["id"]], "test"
    (res / "sources.json").write_text(json.dumps(reg))
    write_refs(res, "algomaster", [{**GOOD_REF, "quality": 5}])
    write_refs(res, "bytebytego", [{**GOOD_REF, "url": "https://b.dev/sw", "quality": 3}])
    write_refs(res, "algomonster", [{**GOOD_REF, "url": "https://m.dev/sw", "quality": 5}])
    write_refs(
        res,
        "designgurus",
        [{**GOOD_REF, "id": "p", "url": "https://d.dev/2sum", "topics": [], "problem_title": "Two Sum"}],
    )
    got = refs.for_topic("algo", "sliding-window")
    assert [r["source"] for r in got] == ["bytebytego", "algomaster"]  # core first, skip hidden
    assert [r["source"] for r in refs.for_problem("two-sum")] == ["designgurus"]
    assert refs.for_problem("two-sum")[0]["spoiler"] is True


def test_refs_about_our_problems_stay_off_lesson_pages(res: Path) -> None:
    ours = {**GOOD_REF, "id": "anim", "url": "https://x.dev/a", "problem_title": "Minimum Window Substring"}
    other = {**GOOD_REF, "id": "anim2", "url": "https://x.dev/b", "problem_title": "Some Problem We Lack"}
    write_refs(res, "algomaster", [ours, other])
    assert [r["id"] for r in refs.for_topic("algo", "sliding-window")] == ["anim2"]
    assert [r["id"] for r in refs.for_problem("minimum-window-substring")] == ["anim"]


def test_focused_refs_beat_broad_ones(res: Path) -> None:
    broad = {
        **GOOD_REF,
        "id": "course",
        "url": "https://x.dev/course",
        "kind": "course-module",
        "quality": 5,
        "topics": ["sliding-window", "two-pointers", "bfs", "dfs", "heaps"],
    }
    focused = {**GOOD_REF, "quality": 3}
    write_refs(res, "algomaster", [broad, focused])
    assert [r["id"] for r in refs.for_topic("algo", "sliding-window")] == ["sw-lesson", "course"]


def test_subject_verdict_overrides(res: Path) -> None:
    reg = json.loads((res / "sources.json").read_text())
    for s in reg["sources"]:
        if s["id"] == "algomaster":
            s.update(verdict="core", reason="t", subject_verdicts={"system-design": "skip"})
    (res / "sources.json").write_text(json.dumps(reg))
    sd = {**GOOD_REF, "id": "ch", "url": "https://x.dev/ch", "subject": "system-design", "topics": ["caching"]}
    write_refs(res, "algomaster", [GOOD_REF, sd])
    assert [r["verdict"] for r in refs.for_topic("algo", "sliding-window")] == ["core"]
    assert refs.for_topic("system-design", "caching") == []
    assert not any(n["id"].startswith("ref:") for n in refs.graph("system-design")["nodes"])
    reg["sources"][0]["subject_verdicts"] = {"algo": "great"}
    (res / "sources.json").write_text(json.dumps(reg))
    assert any("subject_verdicts" in e for e in refs.validate_registry())


def test_graph_edges_and_neighbourhood(res: Path) -> None:
    write_refs(res, "algomaster", [GOOD_REF])
    g = refs.graph("algo")
    ids = {n["id"] for n in g["nodes"]}
    assert {"topic:sliding-window", "problem:two-sum", "ref:algomaster:sw-lesson", "source:algomaster"} <= ids
    types = {(e["from"], e["to"], e["type"]) for e in g["edges"]}
    assert ("topic:arrays-hashing", "topic:sliding-window", "prereq") in types
    assert ("ref:algomaster:sw-lesson", "topic:sliding-window", "covers") in types
    assert ("topic:sliding-window", "problem:minimum-window-substring", "practice") in types
    assert all(e["from"] in ids and e["to"] in ids for e in g["edges"])
    near = refs.neighbourhood("algo", "topic:sliding-window")
    assert near["counts"]["topic"] >= 3 and near["counts"]["ref"] == 1
    assert refs.graph("algo") == g  # deterministic
    many = [{**GOOD_REF, "id": f"r{i}", "url": f"https://x.dev/{i}"} for i in range(8)]
    write_refs(res, "algomaster", many)
    assert refs.neighbourhood("algo", "topic:sliding-window")["counts"]["ref"] == refs.MAX_PER_TOPIC


def test_locked_subject_topic_page() -> None:
    page = learn.topic_page("system-design", "caching")
    assert page["subject_status"] == "locked" and page["has_lesson"] is False
    assert "scalability-basics" in page["topic"]["prereqs"]
    assert page["graph"]["center"] == "topic:caching"
    with pytest.raises(learn.ProblemError):
        learn.topic_page("system-design", "no-such-topic")


def test_catalog_validator_catches_bad_edges(monkeypatch: pytest.MonkeyPatch) -> None:
    cat = {
        "topics": [
            {"id": "a", "name": "A", "kind": "concept", "prereqs": ["b"], "related": ["c"]},
            {"id": "b", "name": "B", "kind": "concept", "prereqs": ["a"], "related": []},
            {"id": "c", "name": "C", "kind": "weird", "prereqs": ["zzz"], "related": []},
        ]
    }
    monkeypatch.setattr(learn, "catalog", lambda subject: cat)
    errors = "\n".join(learn.validate_catalog("x"))
    assert "prerequisite cycle" in errors
    assert "not symmetric" in errors
    assert "kind must be" in errors
    assert "unknown/self id 'zzz'" in errors
