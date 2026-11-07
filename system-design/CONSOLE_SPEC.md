# System Design Console: spec (approved 2026-11-07)

**Goal:** practise system design the way it's actually done in an interview. The student
*drives* the design: writes requirements and assumptions, sketches estimates, defines APIs and
data, draws **versioned** high-level diagrams that evolve, argues trade-offs, and attaches
class/API signatures. Feedback is deterministic first (rubric checks); AI review is opt-in.

**What we don't want** (from the AlgoMaster research): a code-judged console for a design
problem. Code appears only as *signatures*, never as a test-passing implementation.

**Inspirations** (ideas only, described in our own words):
- ByteByteGo's 4-step framework and "naive → name the flaw → replace that part" evolution.
- System Design School's numbered skeleton: step-by-step diagram builds marking what's new,
  Bad/Good/Great deep-dive answers, a live estimator, a transferable-pattern recap.

## 1. Stages (one workspace, one tab per stage)

| # | stage | what the student produces | deterministic check |
|---|---|---|---|
| 1 | **Scope** | Functional requirements (F1…), non-functional (N1…), assumptions (A1…), out of scope. Each item gets an id that later stages cite. | Rubric's must-cover requirements matched by keyword/tag; at least one assumption per NFR. |
| 2 | **Estimates** | Rows of `name = formula [unit]` (DAU → QPS → peak → storage per year → bandwidth). A live calculator evaluates them; there's a reference panel (powers of two, latency numbers). | Units present; values within the rubric's plausible ranges. |
| 3 | **API & data** | Endpoints (method, path, request/response fields, idempotency) and data model (entities, keys, store choice and why). | Rubric's core endpoints/entities present; every F-requirement maps to an endpoint. |
| 4 | **High-level design (versions)** | v1 (naive) → v2 → v3… Each version is a diagram plus a **"why this version"** line citing the flaw, requirement or bottleneck it fixes. | Must-have components present by the final version (e.g. cache, queue); each version cites a reason; the diff vs the previous version is non-empty. |
| 5 | **Deep dives & trade-offs** | 2–3 deep dives. Each holds a trade-off table (options × criteria) with a chosen option linked to the version that adopts it. | Rubric's key decisions addressed (e.g. fan-out push vs pull); a choice is made and justified. |
| 6 | **Wrap-up** | Checklist: bottlenecks and single points of failure, failure handling, monitoring/alerting, rollout, 10× growth, future work. | Checklist items answered (non-empty). |
| + | **Signatures** (any stage) | Class / interface / function signatures in Python or Go, no bodies. For OOD, this is the main artefact. | They parse (Python `ast`, `gofmt`); referenced classes exist in the diagram or data model. |

Optional per-stage timers use interview-like budgets: scope about 5 min, high-level about 15,
deep dive about 15, wrap-up about 5.

## 2. Files (deterministic, diffable, in git)

```
system-design/problems/<slug>/
  README.md          prompt + context (no solution)
  meta.json          title, difficulty, topics (catalog ids), sources
  rubric.json        must-cover requirements, estimate ranges, required components / decisions,
                     wrap-up items, and the reference "transferable pattern" (spoiler, hidden until
                     the attempt is submitted)
  attempts/<date>_<label>/
    design.json      stages 1, 3, 5, 6 (structured: ids, text, links between items)
    estimates.json   rows of name / formula / unit (evaluated by kb, not stored)
    diagrams/v1.json, v2.json …   the diagram-as-code for each version (see 3)
    signatures.py | signatures.go
    notes.md + runs in progress/
```

The same layout serves OOD (`ood/problems/…`: signatures and a class diagram are the core) and
GenAI case studies (extra stages: ML framing, data, evaluation).

## 3. Diagram-as-code (our own small format, rendered by the studio)

```json
{ "version": 2, "why": "v1 single DB can't take 20k read QPS (N2) — add cache + read replicas",
  "nodes": [ {"id":"client","kind":"client"}, {"id":"lb","kind":"load-balancer"},
             {"id":"api","kind":"service","label":"Feed API"}, {"id":"cache","kind":"cache"},
             {"id":"db","kind":"sql","label":"posts (primary)"}, {"id":"replica","kind":"sql"} ],
  "edges": [ {"from":"client","to":"lb"}, {"from":"lb","to":"api"},
             {"from":"api","to":"cache","label":"read"}, {"from":"api","to":"db","label":"write"},
             {"from":"db","to":"replica","label":"replicate"} ],
  "flows": [ {"name":"read feed","path":["client","lb","api","cache"]} ] }
```

**Why not a free-form canvas or Mermaid only:**
- A fixed vocabulary of `kind`s (client, load-balancer, service, cache, sql, nosql, queue,
  stream, blob, cdn, search, worker, external) makes rubric checks and version diffs
  deterministic.
- The studio renders it with a fixed layout: tiers left to right (client → edge → services →
  data), so diagrams look consistent.
- A Mermaid export can come later.

**Version diffs:** kb computes added, removed and renamed nodes/edges between versions. The studio
shows the new parts highlighted, like the "NEW" badge in the inspiration.

**Flows:** numbered request paths can be animated step by step, reusing the trace-player idea.

## 4. Studio console (UX)

- **Left:** the stage tabs with completion ticks. **Centre:** an editor per stage.
  - Scope, API and deep dives are structured forms with free text.
  - Estimates are a spreadsheet-like grid with live results.
  - Diagrams use a node palette with click-to-connect, plus a JSON tab for power users. A version
    timeline (v1 → v2 → v3) shows the diff.
- **Right:** the rubric checklist updating live. Then "Reveal reference" (Bad/Good/Great answer
  levels for each deep dive) **after** the student submits.
- **Writes files:** a new backend endpoint saves into the attempt folder only (path-validated,
  like the quiz endpoint). That makes the studio's first editing feature.
- **Feedback:**
  - `kb run` for design problems runs the rubric checks and records them in `progress/runs.jsonl`
    (per stage). `kb feedback` then covers SD topics the same way as algo.
  - Opt-in AI review (`/learn feedback` → a review of `design.json` against the rubric) for
    qualitative comments.

## 5. Content per case study (authored once by Claude, stored in the repo)

- The prompt, the rubric, and a reference design: a v1 → v3 diagram progression, the transferable
  pattern, and Bad/Good/Great deep-dive answers. All in our own words and drawings.
- Each case study is mapped to catalog topics, so the knowledge graph links it to concept lessons
  and to the curated refs (ByteByteGo, System Design School…).
- Concept topics (caching, sharding…) get short lessons with **simulations** where a trace makes
  sense: consistent hashing ring, rate-limiter buckets, quorum R/W/N, fan-out threshold. The
  existing trace views or a small new "simulation" block can drive them.

## 6. Pilot plan (after approval)

1. Backend: problem/attempt layout, `design.json` / `diagrams` schemas + validators, rubric
   checker, diagram diff. Pytest.
2. Studio: console shell, scope + estimates + diagram editor/renderer + version diff + rubric
   panel; a save endpoint. Vitest.
3. One case study end to end: **URL shortener** (simple, classic). Then **chat system**
   (WebSockets, ordering, presence) to stress the format.
4. Unlock `system-design` in the catalog: the lessons for `sd-framework`, `back-of-envelope`,
   `caching` and `consistent-hashing` first.

## 7. Decisions (2026-11-07)

- **Canvas: a Visio-like window.**
  - The palette is our fixed set of shapes (the `kind` vocabulary), each with its own icon and colour.
  - Drag shapes onto the canvas, move them, connect port to port, label edges, delete.
  - Positions (`x`, `y`) are stored in `diagrams/vN.json`; the rubric ignores them.
  - A JSON tab stays for power users. Built with SVG and pointer events, so there is no new dependency.
- **Mistakes are allowed.** Checks never block saving. Bad structure is caught by **smell rules** in
  the rubric, for example:
  - the client wired straight to a database;
  - a single database under a read-heavy NFR;
  - a queue with no consumer;
  - a service with no path from the client.
- **Tips on demand, deterministic, in levels:** nudge → hint → show. They come from the rubric.
  Tip usage is recorded in `progress/` so feedback can account for it.
- **Hybrid classroom.** The studio is the whiteboard and the dashboard; your own editor is the
  workbench.
  - Every attempt has an "open in VS Code" link (`vscode://file/…`) and a copyable `./kb` command.
  - `.vscode/tasks.json` runs the kb checks on the attempt you have open.
  - The studio never spawns processes.
- **AI review is on demand only.** The `/review` skill runs the deterministic checks first, then writes
  structured feedback (strengths, issues with examples, tips, next step) to `attempts/<dir>/review.md`,
  which the studio shows on the problem page. Nothing calls AI automatically.
