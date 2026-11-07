"""External learning resources: the source registry, research references and the knowledge graph.

resources/sources.json   one registry of every external source (origin tags + learning resources)
resources/refs/<id>.json references found by research agents for one source (validated here)

Agents never hand-map problem slugs: a ref carries `problem_title` and kb matches it to a problem
deterministically (normalised title / slug). The studio shows at most MAX_PER_TOPIC refs per topic,
core sources first, so the platform stays focused.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from kb import learn, scaffold
from kb.naming import SLUG_RE
from kb.paths import ROOT, problems_dir

REF_KINDS = {"lesson", "visual", "article", "problem-solution", "course-module", "diagram", "video", "cheatsheet"}
ACCESS = {"free", "trial", "paid", "local"}
VERDICTS = {"core", "supplementary", "skip", "unreviewed", "tag-only"}
SOURCE_KINDS = {"web", "github", "book", "video"}
MAX_SUMMARY = 240
MAX_PER_TOPIC = 3
VERDICT_RANK = {"core": 0, "supplementary": 1, "unreviewed": 2, "tag-only": 3, "skip": 9}


def resources_dir() -> Path:
    return ROOT / "resources"


def registry() -> dict[str, Any]:
    return json.loads((resources_dir() / "sources.json").read_text())


def source_index(reg: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
    """source id and every alias -> source."""
    reg = reg or registry()
    out: dict[str, dict[str, Any]] = {}
    for s in reg["sources"]:
        out[s["id"]] = s
        for a in s.get("aliases", []):
            out[a] = s
    return out


def verdict_for(source: dict[str, Any], subject: str | None) -> str:
    """A source's verdict for one subject (subject_verdicts overrides the overall verdict)."""
    return (source.get("subject_verdicts") or {}).get(subject or "", source.get("verdict", "unreviewed"))


def resolves(name: str, index: dict[str, dict[str, Any]]) -> bool:
    return name in index or name.startswith("interview:")


def _norm(text: str) -> str:
    text = re.sub(r"^\s*(lc|leetcode)?\s*#?\d+[.):\-\s]+", "", text.lower())
    return re.sub(r"[^a-z0-9]", "", text)


def title_index(problems: Path | None = None) -> dict[str, str]:
    """normalised problem title / slug -> slug (for matching refs' problem_title)."""
    out: dict[str, str] = {}
    for p in scaffold.all_problems(problems or problems_dir()):
        out[_norm(p.meta.get("title", ""))] = p.slug
        out[_norm(p.slug)] = p.slug
    return out


def match_problem(title: Any, index: dict[str, str]) -> str | None:
    return index.get(_norm(title)) if isinstance(title, str) and title else None


def load_refs() -> list[dict[str, Any]]:
    """Every ref with its source id attached (files that fail to parse are skipped here)."""
    out = []
    for path in sorted((resources_dir() / "refs").glob("*.json")):
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            continue
        for r in data.get("refs", []):
            out.append({**r, "source": data.get("source", path.stem)})
    return out


def _topic_ids() -> dict[str, set[str]]:
    return {s: learn.topic_ids(learn.catalog(s)) for s in learn.subjects()}


def validate_registry() -> list[str]:
    errors = []
    reg = registry()
    ids: set[str] = set()
    for i, s in enumerate(reg.get("sources", [])):
        where = f"sources[{i}] ({s.get('id')})"
        if not SLUG_RE.match(str(s.get("id", ""))) or s["id"] in ids:
            errors.append(f"{where}: needs a unique kebab-case id")
        ids.add(str(s.get("id")))
        if s.get("kind") not in SOURCE_KINDS:
            errors.append(f"{where}: kind must be one of {sorted(SOURCE_KINDS)}")
        if s.get("access") not in ACCESS:
            errors.append(f"{where}: access must be one of {sorted(ACCESS)}")
        if s.get("verdict") not in VERDICTS:
            errors.append(f"{where}: verdict must be one of {sorted(VERDICTS)}")
        if s.get("verdict") in {"core", "supplementary", "skip"} and not s.get("reason"):
            errors.append(f"{where}: a {s['verdict']} verdict needs a reason")
        for subj, v in (s.get("subject_verdicts") or {}).items():
            if v not in VERDICTS:
                errors.append(f"{where}: subject_verdicts.{subj} must be one of {sorted(VERDICTS)}")
        if not (s.get("url") or s.get("path")):
            errors.append(f"{where}: needs url or path")
        if "aff=" in str(s.get("url", "")) or "utm_" in str(s.get("url", "")):
            errors.append(f"{where}: strip affiliate/tracking parameters from the url")
    return errors


def validate_refs_file(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [f"{path.name}: invalid JSON: {e}"]
    index = source_index()
    topics = _topic_ids()
    source = data.get("source")
    if source not in index:
        errors.append(f"{path.name}: unknown source {source!r} (add it to resources/sources.json)")
    if path.stem != source:
        errors.append(f"{path.name}: file name must be <source id>.json")
    seen_urls: set[str] = set()
    seen_ids: set[str] = set()
    for i, r in enumerate(data.get("refs", [])):
        where = f"{path.name} refs[{i}] ({r.get('title', '?')})"
        if not SLUG_RE.match(str(r.get("id", ""))) or r["id"] in seen_ids:
            errors.append(f"{where}: needs a unique kebab-case id")
        seen_ids.add(str(r.get("id")))
        if not r.get("title"):
            errors.append(f"{where}: needs a title")
        url, page = r.get("url"), r.get("page")
        if url:
            if not str(url).startswith(("http://", "https://")):
                errors.append(f"{where}: url must be http(s)")
            if "aff=" in url or "utm_" in url:
                errors.append(f"{where}: strip affiliate/tracking parameters")
            if url in seen_urls:
                errors.append(f"{where}: duplicate url")
            seen_urls.add(url)
        elif not isinstance(page, int):
            errors.append(f"{where}: needs a url (web/github) or an integer page (book)")
        if r.get("kind") not in REF_KINDS:
            errors.append(f"{where}: kind must be one of {sorted(REF_KINDS)}")
        if r.get("access") not in ACCESS:
            errors.append(f"{where}: access must be one of {sorted(ACCESS)}")
        subject = r.get("subject")
        if subject not in topics:
            errors.append(f"{where}: unknown subject {subject!r}")
        else:
            bad = [t for t in r.get("topics", []) if t not in topics[subject]]
            if bad:
                errors.append(f"{where}: unknown {subject} topics {bad}")
        if "problem_title" in r and not isinstance(r["problem_title"], str):
            errors.append(f"{where}: problem_title must be a string (the problem's common name)")
        if not r.get("topics") and not r.get("problem_title"):
            errors.append(f"{where}: needs topics and/or problem_title")
        summary = str(r.get("summary", ""))
        if not summary or len(summary) > MAX_SUMMARY:
            errors.append(f"{where}: summary (own words) required, at most {MAX_SUMMARY} chars")
        if not isinstance(r.get("quality"), int) or not 1 <= r["quality"] <= 5:
            errors.append(f"{where}: quality must be an integer 1-5")
    return errors


def validate_all() -> dict[str, list[str]]:
    out = {"sources.json": validate_registry()}
    for path in sorted((resources_dir() / "refs").glob("*.json")):
        out[path.name] = validate_refs_file(path)
    return out


# ------------------------------------------------------------------ lookups for lessons / problems


def _verdict(ref: dict[str, Any], index: dict[str, dict[str, Any]]) -> str:
    return verdict_for(index.get(ref["source"], {}), ref.get("subject"))


KIND_RANK = {"lesson": 0, "visual": 0, "article": 0, "problem-solution": 0, "diagram": 1, "video": 1, "cheatsheet": 1}


def _rank(ref: dict[str, Any], index: dict[str, dict[str, Any]]) -> tuple[int, int, int, int, str]:
    """Focus first (a ref about 1-2 topics beats a broad chapter / case study / course outline),
    then source verdict (core before supplementary), then kind (teaching material first), then quality."""
    verdict = _verdict(ref, index)
    n_topics = len(ref.get("topics", []))
    focus = 0 if n_topics <= 2 else 1 if n_topics <= 4 else 2
    return (
        focus,
        VERDICT_RANK.get(verdict, 5),
        KIND_RANK.get(ref.get("kind", ""), 2),
        -int(ref.get("quality", 0)),
        ref.get("title", ""),
    )


def _public(ref: dict[str, Any], index: dict[str, dict[str, Any]]) -> dict[str, Any]:
    src = index.get(ref["source"], {})
    return {
        "id": ref["id"],
        "title": ref["title"],
        "url": ref.get("url"),
        "page": ref.get("page"),
        "kind": ref["kind"],
        "access": ref["access"],
        "summary": ref["summary"],
        "quality": ref["quality"],
        "source": ref["source"],
        "source_name": src.get("name", ref["source"]),
        "verdict": _verdict(ref, index),
    }


def for_topic(subject: str, topic: str, limit: int = MAX_PER_TOPIC) -> list[dict[str, Any]]:
    """Top refs for a topic. Refs about one of OUR practice problems are excluded here (they would
    spoil it) and shown on that problem's page instead."""
    index = source_index()
    pdir = ROOT / subject / "problems"
    titles = title_index(pdir) if pdir.is_dir() else {}
    hits = [
        r
        for r in load_refs()
        if r.get("subject") == subject
        and topic in r.get("topics", [])
        and _verdict(r, index) != "skip"
        and match_problem(r.get("problem_title"), titles) is None
    ]
    return [_public(r, index) for r in sorted(hits, key=lambda r: _rank(r, index))[:limit]]


def for_problem(slug: str, limit: int = MAX_PER_TOPIC) -> list[dict[str, Any]]:
    """Refs explaining one of our problems: they contain solutions, so they're flagged as spoilers."""
    index, titles = source_index(), title_index()
    hits = [
        r for r in load_refs() if match_problem(r.get("problem_title"), titles) == slug and _verdict(r, index) != "skip"
    ]
    return [{**_public(r, index), "spoiler": True} for r in sorted(hits, key=lambda r: _rank(r, index))[:limit]]


# ------------------------------------------------------------------ knowledge graph


def graph(subject: str) -> dict[str, Any]:
    """Deterministic knowledge graph of one subject: topics, problems, refs, sources and their edges.

    Edges: prereq / related (topic→topic, authored in the catalog), practice (topic→problem, from
    problem tags via aliases), covers (ref→topic), explains (ref→problem), from (ref→source).
    """
    cat = learn.catalog(subject)
    aliases = learn.alias_map(cat)
    index = source_index()
    nodes: dict[str, dict[str, Any]] = {}
    edges: list[dict[str, str]] = []

    def node(nid: str, **attrs: Any) -> None:
        nodes.setdefault(nid, {"id": nid, **attrs})

    for t in cat["topics"]:
        node(
            f"topic:{t['id']}",
            type="topic",
            label=t["name"],
            kind=t.get("kind"),
            status=t.get("status", "open"),
            has_lesson=learn.has_lesson(subject, t["id"]),
        )
        for p in t.get("prereqs", []):
            edges.append({"from": f"topic:{p}", "to": f"topic:{t['id']}", "type": "prereq"})
        for r in t.get("related", []):
            if t["id"] < r:  # undirected: store once
                edges.append({"from": f"topic:{t['id']}", "to": f"topic:{r}", "type": "related"})

    pdir = ROOT / subject / "problems"
    for p in scaffold.all_problems(pdir) if pdir.is_dir() else []:
        node(
            f"problem:{p.slug}", type="problem", label=p.meta.get("title", p.slug), difficulty=p.meta.get("difficulty")
        )
        for tag in sorted({aliases[t] for t in p.meta.get("patterns", []) if t in aliases}):
            edges.append({"from": f"topic:{tag}", "to": f"problem:{p.slug}", "type": "practice"})

    titles = title_index(pdir) if pdir.is_dir() else {}
    for r in load_refs():
        if r.get("subject") != subject or _verdict(r, index) == "skip":
            continue
        rid = f"ref:{r['source']}:{r['id']}"
        node(
            rid, type="ref", label=r["title"], kind=r["kind"], access=r["access"], url=r.get("url"), page=r.get("page")
        )
        src = index.get(r["source"], {})
        node(
            f"source:{r['source']}",
            type="source",
            label=src.get("name", r["source"]),
            verdict=verdict_for(src, subject),
        )
        edges.append({"from": rid, "to": f"source:{r['source']}", "type": "from"})
        for t in r.get("topics", []):
            edges.append({"from": rid, "to": f"topic:{t}", "type": "covers"})
        slug = match_problem(r.get("problem_title"), titles)
        if slug:
            edges.append({"from": rid, "to": f"problem:{slug}", "type": "explains"})

    edges = [e for e in edges if e["from"] in nodes and e["to"] in nodes]
    unique = {(e["from"], e["to"], e["type"]): e for e in edges}
    return {"subject": subject, "nodes": sorted(nodes.values(), key=lambda n: n["id"]), "edges": list(unique.values())}


def neighbourhood(subject: str, center: str) -> dict[str, Any]:
    """Nodes one hop from `center` (plus their edges) for the studio's topic-centred view."""
    g = graph(subject)
    near = {center}
    for e in g["edges"]:
        if center in (e["from"], e["to"]):
            near |= {e["from"], e["to"]}
    if center.startswith("topic:"):  # keep the picture focused: only the curated top refs
        keep = {f"ref:{r['source']}:{r['id']}" for r in for_topic(subject, center.split(":", 1)[1])}
        near = {n for n in near if not n.startswith("ref:") or n in keep}
    nodes = [n for n in g["nodes"] if n["id"] in near]
    edges = [e for e in g["edges"] if e["from"] in near and e["to"] in near]
    groups: dict[str, int] = defaultdict(int)
    for n in nodes:
        groups[n["type"]] += 1
    return {"subject": subject, "center": center, "nodes": nodes, "edges": edges, "counts": dict(groups)}
