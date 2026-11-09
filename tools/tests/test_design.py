"""Design problems: rubric checks, smells, estimates, spoilers, attempts, API."""

from __future__ import annotations

import json
import shutil
import threading
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import pytest
from kb import design, history, sessions
from kb.paths import ROOT, workspace_dir
from kb.schema import ProblemError

FIXTURE = ROOT / "tools/tests/testdata/design_check_fixture.json"


@pytest.fixture
def problem() -> design.DesignProblem:
    return design.load("system-design", "url-shortener")


def copy_reference(problem: design.DesignProblem, adir: Path) -> None:
    ref = problem.dir / "reference"
    for f in ("design.json", "estimates.json"):
        shutil.copy(ref / f, adir / f)
    for f in (ref / "diagrams").glob("*.json"):
        shutil.copy(f, adir / "diagrams" / f.name)


def test_all_authored_design_problems_validate() -> None:
    for subject in design.DESIGN_SUBJECTS:
        for p in design.all_problems(subject):
            assert design.validate_problem(p) == [], f"{subject}/{p.slug}"
    assert design.all_problems("system-design"), "expected at least the url-shortener"


def test_check_fixture_is_current(problem: design.DesignProblem) -> None:
    """Shared contract with the studio (studio/src/design.test.ts reads the same file)."""
    got = design.run_checks(problem, problem.dir / "reference")
    got["attempt"] = "2026-11-07_design_reference"
    assert json.loads(FIXTURE.read_text()) == json.loads(json.dumps(got)), "regenerate the fixture"


@pytest.mark.parametrize(
    "formula, want",
    [
        ("100 * million / month", 100e6 / (30 * 86400)),
        ("2 ** 10", 1024),
        ("2 ^ 10", 1024),
        ("-(3 + 4) * 2", -14),
        ("prev * 3", 30),
    ],
)
def test_estimates_evaluate(formula: str, want: float) -> None:
    rows = [{"name": "prev", "formula": "10", "unit": ""}, {"name": "x", "formula": formula, "unit": ""}]
    assert design.evaluate_estimates(rows)[1]["value"] == pytest.approx(want)


@pytest.mark.parametrize(
    "formula, err",
    [
        ("10 ** 10 ** 10", "exponent"),
        ("__import__('os')", "only numbers"),
        ("later + 1", "unknown name"),
        ("1 / 0", "division"),
        ("(9 ** 60) ** 3", "out of range"),
        ("x.y", "only numbers"),
        ("1 +", "syntax"),
    ],
)
def test_estimates_reject_unsafe_or_bad(formula: str, err: str) -> None:
    out = design.evaluate_estimates([{"name": "x", "formula": formula, "unit": ""}])
    assert out[0]["value"] is None and err in out[0]["error"]


def test_units_convert_within_a_dimension() -> None:
    assert design.convert(3e12, "B", "TB") == pytest.approx(3)
    assert design.convert(60, "/min", "/s") == pytest.approx(1)
    assert design.convert(1, "TB", "/s") is None


def test_new_attempt_fails_checks_and_reference_passes(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    assert adir.parent == workspace_dir() / "attempts" / "system-design" / "url-shortener"
    empty = design.run_checks(problem, adir)
    assert empty["passed"] == 0 and empty["errors"] == [] and empty["final_smells"] == []
    copy_reference(problem, adir)
    full = design.run_checks(problem, adir)
    assert full["passed"] == full["total"] == 20 and full["final_smells"] == []
    assert [v["smells"] for v in full["versions"]][0] == ["single-store-read-heavy", "no-load-balancer"]
    assert full["versions"][2]["diff"]["added_nodes"] == ["agg", "clicks", "stats"]


@pytest.mark.parametrize(
    "nodes, edges, flags, rule",
    [
        ([("c", "client"), ("db", "sql")], [("c", "db")], {}, "client-to-store"),
        ([("c", "client"), ("s", "service"), ("x", "cache")], [("c", "s")], {}, "orphan-node"),
        ([("c", "client"), ("s", "service"), ("q", "queue")], [("c", "s"), ("s", "q")], {}, "queue-no-consumer"),
        ([("c", "client"), ("s", "service"), ("t", "service")], [("c", "s"), ("t", "s")], {}, "unreachable"),
        (
            [("c", "client"), ("s", "service"), ("d", "sql")],
            [("c", "s"), ("s", "d")],
            {"read_heavy": True},
            "single-store-read-heavy",
        ),
        ([("c", "client"), ("s", "service")], [("c", "s")], {"needs_lb": True}, "no-load-balancer"),
    ],
)
def test_smells(nodes: list, edges: list, flags: dict, rule: str) -> None:
    d = {
        "version": 1,
        "nodes": [{"id": i, "kind": k} for i, k in nodes],
        "edges": [{"from": a, "to": b} for a, b in edges],
    }
    assert rule in [s["rule"] for s in design.smells(d, flags, "system-design")]


def test_save_validates_and_never_escapes_the_attempt(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    design.save(
        "system-design", "url-shortener", adir.name, "diagram", {"version": 2, "why": "x", "nodes": [], "edges": []}, 2
    )
    assert (adir / "diagrams" / "v2.json").exists()
    with pytest.raises(ProblemError, match="kind"):
        bad = {"version": 3, "nodes": [{"id": "a", "kind": "spaceship"}], "edges": []}
        design.save("system-design", "url-shortener", adir.name, "diagram", bad, 3)
    with pytest.raises(ProblemError, match="version"):
        design.save("system-design", "url-shortener", adir.name, "diagram", {"version": 99}, 99)
    with pytest.raises(ProblemError, match="file must be"):
        design.save("system-design", "url-shortener", adir.name, "../../evil", {}, None)
    with pytest.raises(ProblemError, match="bad attempt"):
        design.save("system-design", "url-shortener", "../x", "design", design.empty_design())
    with pytest.raises(ProblemError):
        design.load("system-design", "../algo")


def test_public_payload_has_no_spoilers(problem: design.DesignProblem) -> None:
    text = json.dumps(design.public_problem(problem))
    for c in problem.rubric["checks"]:
        assert c["tips"]["show"] not in text and c["tips"]["hint"] not in text
    assert problem.rubric["pattern"] not in text
    assert "range-leased counter" not in text and "keywords" not in text
    adir = design.new_attempt(problem)
    with pytest.raises(ProblemError, match="submit"):
        design.reference(problem, adir)
    design.submit(problem, adir)
    assert "## 4. Decompose" in design.reference(problem, adir)["walkthrough"]


def test_check_records_only_when_asked_and_tips_are_logged(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    design.run_checks(problem, adir)
    assert history.runs() == []
    copy_reference(problem, adir)
    design.record(design.run_checks(problem, adir))
    (run,) = history.runs()
    assert run["subject"] == "system-design" and run["passed"] == 20 and run["verdict"] is True
    assert design.tip(problem, "comp-cache", "nudge", adir.name).startswith("Most redirects")
    assert history._read("tips.jsonl")[0]["check"] == "comp-cache"  # noqa: SLF001


def test_sessions_include_design_problems() -> None:
    s = sessions.generate(subject="system-design", count=1)
    assert s["items"][0]["kind"] == "sd-problem" and sessions.validate(s) == []
    sessions.save(s)
    adir = sessions.start_attempt(s["id"], "p1", "design")
    assert adir.name.endswith("_design_practice")
    p = design.load("system-design", "url-shortener")
    copy_reference(p, adir)
    design.record(design.run_checks(p, adir))
    ev = sessions.evaluate(sessions.load(s["id"]))
    assert ev["items"][0]["score"] == 100


# ------------------------------------------------------------------ API


def _call(url: str, body: Any = None, headers: dict | None = None) -> tuple[int, Any]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data, {"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def test_design_api_end_to_end() -> None:
    from kb.server import make_server

    httpd = make_server(0)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/api/design/system-design/url-shortener"
    try:
        status, prob = _call(base)
        assert status == 200 and prob["palette"][0] == "client" and len(prob["checks"]) == 20
        assert "tips" not in json.dumps(prob["checks"])
        status, att = _call(f"{base}/attempt", {})
        assert status == 201 and att["check"]["passed"] == 0
        name = att["name"]
        v2 = {
            "version": 2,
            "why": "add a cache",
            "nodes": [
                {"id": "client", "kind": "client", "x": 1, "y": 2},
                {"id": "lb", "kind": "load-balancer"},
                {"id": "svc", "kind": "service"},
                {"id": "cache", "kind": "cache"},
                {"id": "db", "kind": "nosql"},
            ],
            "edges": [
                {"from": "client", "to": "lb"},
                {"from": "lb", "to": "svc"},
                {"from": "svc", "to": "cache"},
                {"from": "svc", "to": "db"},
            ],
        }
        status, check = _call(f"{base}/{name}/save", {"file": "diagram", "version": 2, "content": v2})
        assert status == 200 and {c["id"] for c in check["checks"] if c["passed"]} == {
            "comp-cache",
            "comp-lb",
            "comp-store",
        }
        assert (
            _call(
                f"{base}/{name}/save",
                {
                    "file": "diagram",
                    "version": 2,
                    "content": {"version": 2, "nodes": [{"id": "x", "kind": "ufo"}], "edges": []},
                },
            )[0]
            == 422
        )
        assert history.runs() == []  # saves are never recorded
        assert _call(f"{base}/{name}/reference")[0] == 409
        assert _call(f"{base}/tip", {"check": "comp-cache", "level": "hint"})[1]["text"]
        status, sol = _call(f"{base}/solution")  # Read mode: always available, logs nothing by itself
        assert status == 200 and "## 4. Decompose" in sol["walkthrough"] and len(sol["design"]["parts"]) == 3
        assert not design.solution_seen("system-design", "url-shortener")
        assert _call(f"{base}/{name}/check", {})[0] == 200 and len(history.runs()) == 1
        assert _call(f"{base}/{name}/submit", {})[1]["submitted"] is True
        status, ref = _call(f"{base}/{name}/reference")
        assert status == 200 and len(ref["diagrams"]) == 3
        assert (
            _call(
                f"{base}/{name}/save",
                {"file": "diagram", "version": 2, "content": v2},
                {"Origin": "https://evil.example"},
            )[0]
            == 403
        )
        big = {"file": "signatures", "content": "x" * 100_000}
        assert _call(f"{base}/{name}/save", big)[0] == 422
        status, rows = _call(f"http://127.0.0.1:{httpd.server_address[1]}/api/problems/system-design")
        assert status == 200 and "url-shortener" in {r["slug"] for r in rows}
    finally:
        httpd.shutdown()


def test_cli_sd_and_run_on_design_attempts(problem: design.DesignProblem, capsys: pytest.CaptureFixture) -> None:
    from kb.cli import main

    assert main(["sd", "validate", "url-shortener"]) == 0
    assert main(["sd", "attempt", "url-shortener", "--label", "cli"]) == 0
    (adir,) = problem.attempts()
    assert main(["run", str(adir / "diagrams" / "v1.json"), "--no-log"]) == 1  # path form, nothing passes yet
    assert main(["sd", "tip", str(adir), "comp-cache", "--level", "hint"]) == 0
    copy_reference(problem, adir)
    assert main(["run", str(adir / "design.json")]) == 0
    assert "20/20 checks passed" in capsys.readouterr().out
    assert len(history.runs()) == 1  # kb run records (like algo runs); --no-log doesn't
    assert main(["sd", "submit", "url-shortener", adir.name]) == 0
    assert (adir / "submitted.json").exists()


def test_matching_uses_values_not_keys_and_targeted_edges() -> None:
    assert "request" not in design._norm({"request": "", "path": "/x"})  # noqa: SLF001
    p = design.load("system-design", "url-shortener")
    adir = design.new_attempt(p)
    v1 = {
        "version": 1,
        "why": "",
        "nodes": [
            {"id": "svc", "kind": "service", "label": "Redirect"},
            {"id": "q", "kind": "queue", "label": "clicks"},
        ],
        "edges": [{"from": "svc", "to": "q", "label": "emit"}],
    }
    (adir / "diagrams" / "v1.json").write_text(json.dumps(v1))
    edge = {"id": "e", "type": "edge", "label": "x", "from_kinds": ["service"], "to_kinds": ["queue"], "tips": {}}
    cases = [
        ({}, True),
        ({"to_keywords": ["click"]}, True),
        ({"to_keywords": ["audit"]}, False),
        ({"label_keywords": ["emit"]}, True),
        ({"from_keywords": ["shorten"]}, False),
    ]
    for extra, want in cases:
        p.rubric = {"checks": [{**edge, **extra}]}
        assert design.run_checks(p, adir)["checks"][0]["passed"] is want, extra


def test_signature_names_are_qualified(tmp_path: Path) -> None:
    (tmp_path / "signatures.py").write_text(
        "class Cache:\n    def get(self, k): ...\nclass LRUCache(Cache):\n    def put(self, k, v): ...\n"
    )
    names = design._signature_names(tmp_path)  # noqa: SLF001
    assert {"cache", "cache.get", "lrucache(cache)", "lrucache.put"} <= names and "lrucache.get" not in names
    (tmp_path / "signatures.go").write_text("type Lot struct{}\nfunc (l *Lot) Park(v int) error { return nil }\n")
    assert "lot.park" in design._signature_names(tmp_path)  # noqa: SLF001


def test_signature_check_accepts_alternative_names() -> None:
    p = design.load("ood", "shopping-cart")
    adir = design.new_attempt(p)
    check = {
        "id": "s",
        "type": "signature",
        "label": "deal",
        "names": ["BuyXGetYPromotion(Promotion)|BOGOPromotion(Promotion)"],
    }
    p.rubric = {"checks": [check]}
    (adir / "signatures.py").write_text("class Promotion: ...\nclass BOGOPromotion(Promotion): ...\n")
    assert design.run_checks(p, adir)["checks"][0]["passed"] is True
    (adir / "signatures.py").write_text("class Promotion: ...\nclass Deal(Promotion): ...\n")
    result = design.run_checks(p, adir)["checks"][0]
    assert result["passed"] is False and "BuyXGetYPromotion" in result["detail"]


def test_ood_smells() -> None:
    d = {
        "version": 1,
        "nodes": [
            {"id": "Pricing", "kind": "interface"},
            {"id": "Lot", "kind": "class"},
            {"id": "Spot", "kind": "class"},
            {"id": "Size", "kind": "enum"},
        ],
        "edges": [{"from": "Lot", "to": "Pricing", "label": "uses"}],
    }
    rules = {s["rule"]: s["nodes"] for s in design.smells(d, {}, "ood")}
    assert rules["orphan-class"] == ["Spot"]
    assert "unimplemented-interface" not in rules  # Lot points at it
    d["edges"] = [{"from": "Lot", "to": "Spot"}]
    assert {s["rule"] for s in design.smells(d, {}, "ood")} == {"orphan-class", "unimplemented-interface"}


def test_requirement_sections_and_decision_choice() -> None:
    p = design.load("system-design", "url-shortener")
    adir = design.new_attempt(p)
    doc = design.empty_design()
    doc["scope"]["functional"] = [{"id": "F1", "text": "fast redirects"}]
    doc["deep_dives"] = [
        {"id": "D", "title": "ids", "options": [{"name": "hash"}], "choice": "counter", "why": "no collisions"}
    ]
    (adir / "design.json").write_text(json.dumps(doc))
    tips = {"nudge": "n", "hint": "h", "show": "s"}
    req = {"id": "r", "type": "requirement", "label": "x", "keywords": ["fast"], "tips": tips}
    dec = {"id": "d", "type": "decision", "label": "x", "keywords": ["ids"], "tips": tips}
    cases = [
        (req, True),
        ({**req, "sections": ["non_functional"]}, False),
        (dec, True),
        ({**dec, "choice_keywords": ["counter"]}, True),
        ({**dec, "choice_keywords": ["hash"]}, False),
    ]
    for check, want in cases:
        p.rubric = {"checks": [check]}
        assert design.run_checks(p, adir)["checks"][0]["passed"] is want, check


def test_save_guards_against_gaps_partial_docs_and_bad_units() -> None:
    p = design.load("system-design", "url-shortener")
    adir = design.new_attempt(p)
    a = ("system-design", "url-shortener", adir.name)
    blank = {"version": 3, "why": "x", "nodes": [], "edges": []}
    with pytest.raises(ProblemError, match="consecutive"):
        design.save(*a, "diagram", blank, 3)
    design.save(*a, "diagram", {**blank, "version": 2}, 2)
    design.save(*a, "diagram", blank, 3)
    with pytest.raises(ProblemError, match="latest"):
        design.delete_diagram(*a, 2)
    design.delete_diagram(*a, 3)
    assert [d["version"] for d in design.diagram_versions(adir)] == [1, 2]
    with pytest.raises(ProblemError, match="missing"):
        design.save(*a, "design", {"version": 1})
    with pytest.raises(ProblemError, match="unknown unit"):
        design.save(*a, "estimates", {"version": 1, "rows": [{"name": "x", "formula": "1", "unit": "zz"}]})


def _part(pid: str, title: str, nodes: list[tuple[str, str]], edges: list[tuple[str, str]], **kw: Any) -> dict:
    return {
        "id": pid,
        "title": title,
        "covers": [],
        "problem": "",
        "options": [],
        "choice": kw.get("choice", "a choice"),
        "why": kw.get("why", "because"),
        "technologies": [],
        "patterns": [],
        "diagram": {
            "nodes": [{"id": i, "kind": k} for i, k in nodes],
            "edges": [{"from": a, "to": b} for a, b in edges],
        },
    }


def test_parts_check_compose_and_reduce_smell(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    doc = json.loads((adir / "design.json").read_text())
    assert doc["parts"] == []
    read = _part("P1", "Redirect read path", [("svc", "service"), ("cache", "cache")], [("svc", "cache")])
    clicks = _part("P2", "Click analytics", [("svc", "service"), ("q", "stream")], [("svc", "q")], why="")
    doc["parts"] = [read, clicks]
    design.save("system-design", "url-shortener", adir.name, "design", doc)
    res = design.run_checks(problem, adir)
    by = {c["id"]: c for c in res["checks"]}
    assert by["part-read-path"]["passed"] and not by["part-analytics"]["passed"]  # P2 has no why
    assert res["stages"]["parts"] == {"passed": 1, "total": 3}
    smell = [s for s in res["final_smells"] if s["rule"] == "part-not-composed"]
    assert smell and smell[0]["nodes"] == ["cache", "q", "svc"]
    v1 = json.loads((adir / "diagrams" / "v1.json").read_text())
    merged = design.compose(v1, [read, clicks])
    assert [n["id"] for n in merged["nodes"]] == ["client", "svc", "cache", "q"]
    assert design.compose(merged, [read]) == merged  # idempotent: existing nodes/edges win
    merged["edges"].append({"from": "client", "to": "svc"})
    design.save("system-design", "url-shortener", adir.name, "diagram", merged, 1)
    res = design.run_checks(problem, adir)
    assert not [s for s in res["final_smells"] if s["rule"] == "part-not-composed"]


def test_design_without_parts_still_loads_and_bad_parts_are_rejected(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    doc = json.loads((adir / "design.json").read_text())
    del doc["parts"]  # v1 attempts in learners' workspaces have no parts
    design.save("system-design", "url-shortener", adir.name, "design", doc)
    assert design.run_checks(problem, adir)["errors"] == []
    doc["parts"] = [_part("P1", "x", [("a", "ufo")], []), _part("P1", "y", [], [])]
    with pytest.raises(ProblemError, match="kind must be one of|unique short identifier"):
        design.save("system-design", "url-shortener", adir.name, "design", doc)


def test_reading_the_solution_removes_the_first_try_bonus(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    copy_reference(problem, adir)
    design.record(design.run_checks(problem, adir))
    assert sessions.item_score(history.runs()) == 100
    design.mark_solution_seen(problem)
    adir2 = design.new_attempt(problem, "again")
    copy_reference(problem, adir2)
    design.record(design.run_checks(problem, adir2))
    later = [r for r in history.runs() if r["attempt"] == adir2.name]
    assert later[0]["solution_seen"] is True and sessions.item_score(later) == 90


def test_sd_content_gate_requires_layout_and_parts(problem: design.DesignProblem, tmp_path: Path) -> None:
    clone = tmp_path / "system-design" / "problems" / "url-shortener"
    shutil.copytree(problem.dir, clone)
    md = clone / "reference.md"
    md.write_text(md.read_text().replace("## 8. Patterns", "## 8. Other").replace("part:P3", "part:P9"))
    p = design.DesignProblem(dir=clone, meta=problem.meta, rubric=problem.rubric)
    errors = design.validate_problem(p)
    assert "reference.md is missing the '## Patterns' section" in errors
    assert any("part:P9" in e for e in errors)


def _graph(nodes: list[tuple[str, str]], edges: list[tuple[str, str, str]]) -> dict:
    return {
        "version": 1,
        "nodes": [{"id": i, "kind": k} for i, k in nodes],
        "edges": [{"from": a, "to": b, "label": lab} for a, b, lab in edges],
    }


def test_presigned_uploads_and_external_entries_are_not_smells() -> None:
    nodes = [("c", "client"), ("s", "service"), ("b", "blob"), ("x", "external"), ("h", "service")]
    edges = [("c", "s", ""), ("s", "b", ""), ("x", "h", "webhook"), ("h", "b", "")]
    ok = _graph(nodes, [*edges, ("c", "b", "PUT chunk (presigned URL)")])
    assert design.smells(ok, {}, "system-design") == []
    bad = _graph(nodes, [*edges, ("c", "b", "PUT chunk")])
    assert [s["rule"] for s in design.smells(bad, {}, "system-design")] == ["client-to-store"]


def test_out_of_scope_items_do_not_satisfy_requirements(problem: design.DesignProblem) -> None:
    adir = design.new_attempt(problem)
    doc = json.loads((adir / "design.json").read_text())
    doc["scope"]["out_of_scope"] = [{"id": "O1", "text": "Shorten URLs and redirect visitors"}]
    design.save("system-design", "url-shortener", adir.name, "design", doc)
    by = {c["id"]: c["passed"] for c in design.run_checks(problem, adir)["checks"]}
    assert not by["req-shorten"] and not by["req-redirect"]
