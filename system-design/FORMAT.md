# Design problems: file format and API contract (v1 files, v2 layout)

**v2 (2026-11-07):** system design is practised as **decompose → reduce**:
1. Split the problem into **parts** (sub-problems).
2. Solve each part on its own: options, a choice, technologies, patterns and a small sub-diagram.
3. Merge the parts by node id into the high-level design.

Each solution follows a fixed reading layout (`reference.md` sections below). Files keep `version: 1`; `parts` is
an optional key, so older attempts still load.

This is the contract between content (`<subject>/problems/<slug>/`), the checker (`tools/kb/design.py`),
the API (`tools/kb/server.py`) and the studio console (`studio/src/api.ts` → `Design*` types). It applies
to `system-design` and `ood`. `./kb sd validate [slug] [--subject ood]` enforces the content rules.
The shared fixture `tools/tests/testdata/design_check_fixture.json` is a real check result; pytest and
vitest both read it, so regenerate it when the shape changes.

## Content: `<subject>/problems/<slug>/`

| file | what |
|---|---|
| `README.md` | Prompt plus what the interviewer says if asked (numbers!) and "things worth deciding". **No answers.** |
| `meta.json` | `{title, difficulty: easy\|medium\|hard, kind: "design", topics: [catalog ids], technologies: [ids, group "technologies"], design_patterns: [ids, group "patterns"], aka?: ["WhatsApp"], sources: [{name}], minutes}`. System design requires `technologies` and `design_patterns`; OOD omits them. |
| `rubric.json` | `{version: 1, flags: {read_heavy?, needs_lb?}, pattern: "transferable lesson", checks: [...]}` |
| `reference.md` | The worked solution in our own words, in the **solution layout** below. It is readable any time in the reader's Solution tab (Read mode, after a reveal prompt), and inside the console only after submitting (Practice mode). |
| `reference/` | A complete attempt (`design.json`, `estimates.json`, `diagrams/v1.json…`, optional `signatures.py`). It **must pass every check with no smells in its final version**, and must evolve over at least two versions, each with a `why`. |

### Rubric checks
Every check has `id` (kebab), `type`, `label` and `tips: {nudge, hint, show}`.
- **Labels are shown before submit, so they must not give the answer away.** Write "Read path can
  absorb the read load", not "Add a Redis cache".
- **Keywords** are case-insensitive substrings of field *values* (never the JSON key names). Be generous with synonyms and spellings; tips cover
  the gaps.

| type | stage | extra fields | passes when |
|---|---|---|---|
| `requirement` | scope | `keywords`, `sections?` | a scope item contains a keyword (only in `sections`, e.g. `["non_functional"]`, if given) |
| `estimate` | estimates | `keywords`, `unit`, `min`, `max` | a row whose *name* contains a keyword evaluates, converted to `unit`, within [min, max] |
| `endpoint` | api | `keywords`, `method?` | an api row (same method, if given) contains a keyword |
| `entity` | api | `keywords` | a data row contains a keyword |
| `component` | high-level | `kinds`, `keywords?` | the **final** diagram has a node of one of `kinds` (and a label/id keyword, if given) |
| `edge` | high-level | `from_kinds`, `to_kinds`, `from_keywords?`, `to_keywords?`, `label_keywords?` | the final diagram has an edge from a `from_kinds` node to a `to_kinds` node (whose label/id and edge label match the optional keywords) |
| `part` | parts | `keywords`, `choice_keywords?` | a part whose title/problem/covers/choice contains a keyword has a non-empty `choice`, `why` and a sub-diagram with ≥ 1 node (and the choice matches `choice_keywords`, if given) |
| `decision` | deep-dives | `keywords`, `choice_keywords?` | a deep dive mentions a keyword **and** has a non-empty `choice` and `why` (and the choice itself matches `choice_keywords`, if given) |
| `wrapup` | wrap-up | `key` ∈ bottlenecks, failures, monitoring, scale, future | that wrap-up answer has ≥ 15 chars |
| `signature` | signatures | `names` | `signatures.py` / `signatures.go` declares every name: `Name`, `Class.method` (method on that class / Go receiver), or `Class(Base)` (Python base class) |

Aim for 14–22 checks per system design problem, covering every stage, including **at least 2 `part` checks**. OOD problems lean on
`component` (class kinds), `edge` and `signature`.

**Flags** turn on smell rules: `read_heavy` → `single-store-read-heavy`; `needs_lb` → `no-load-balancer`.

## Solution layout (`reference.md`, system design; `kb sd validate` enforces it)
The H2 sections must appear in this order. Numbering is allowed: `## 4. Decompose: the parts` matches `Decompose`.

| # | section | what goes in it |
|---|---|---|
| | `What makes it distinctive` | 2–4 sentences: the one property that drives this design |
| 1 | `Requirements and assumptions` | table of F/N ids; assumptions; out of scope |
| 2 | `Scale numbers` | table quantity, formula, ≈ value; what the numbers imply |
| 3 | `API and data model` | endpoints, entities, and where each lives |
| 4 | `Decompose` | one `### Part Pn: title (F…, N…)` per part: the sub-problem, an options table (option, pros, cons; the choice in bold), the choice and why, then a ```` ```diagram ```` fence containing `part:Pn` |
| 5 | `Reduce` | v1 → vN, each a short paragraph saying which part(s) it composes, then a ```` ```diagram ```` fence containing `vN` |
| 6 | `Deep dives` | the low-level details: failure handling, consistency, hot spots |
| 7 | `Technologies` | table technology, role here, alternatives; link `(#/topic/system-design/<id>)` |
| 8 | `Patterns` | bullets linking pattern topics, plus the transferable shape |
| 9 | `Evaluation` | bottlenecks, failures, monitoring, and **the 30-second answer** |
| 10 | `Tips` | tips and common mistakes |
| 11 | `Learn more` | links to lessons `(#/learn/system-design/<id>)` and topics `(#/topic/system-design/<id>)`; every link must be a real catalog id |

Diagram fences are rendered from the `reference/` attempt:
- ```` ```diagram ```` + `v2` shows that diagram version;
- ```` ```diagram ```` + `part:P1` shows that part's sub-diagram.

Each fence must name something that exists. Write everything in our own words: other sites are layout
inspiration only.

## Parts (decompose → reduce)
- `design.json` has `parts: [{id, title, covers: ["F1","N2"], problem, options: [{name, pros, cons}], choice, why, technologies: [str], patterns: [str], diagram: {nodes, edges}}]`
  (≤ 12 parts; node `kind`s come from the palette).
- **Reduce = merge by node id.** A part's sub-diagram reuses the ids that the high-level design uses, and
  `design.compose(diagram, parts)` adds missing nodes and edges.
- The final version gets a `part-not-composed` smell for any part node it lacks.
- References need ≥ 2 parts. Each needs every field and ≥ 2 options, and the parts must be composed
  into the final version.
- Typical cut: one part per hard requirement, e.g. the hot read path, the write/ingest path, fan-out,
  search, payments or holds, real-time push, and analytics. Deep dives then go one level lower inside
  the composed design.

## Palettes (node `kind`)
- **system-design:** client, dns, cdn, load-balancer, api-gateway, service, worker, scheduler, cache,
  sql, nosql, blob, search, queue, stream, coordinator, external
- **ood:** actor, class, abstract, interface, enum

Stages:
- **system-design:** scope, estimates, api, parts, high-level, deep-dives, wrap-up.
- **ood:** scope, api, high-level, deep-dives, wrap-up, signatures; `estimates.json` is optional.

## Attempt: `<workspace>/attempts/<subject>/<slug>/<YYYY-MM-DD>_design_<label>/`

```jsonc
// design.json
{ "version": 1,
  "scope": { "functional": [{"id": "F1", "text": "…"}], "non_functional": [...], "assumptions": [...], "out_of_scope": [...] },
  "api":  [{"id": "E1", "method": "POST", "path": "/urls", "request": "…", "response": "…", "notes": "…"}],
  "data": [{"id": "D1", "name": "links", "fields": "…", "store": "nosql", "why": "…"}],
  "parts": [{"id": "P1", "title": "Redirect read path", "covers": ["F2", "N1"], "problem": "…",
             "options": [{"name": "…", "pros": "…", "cons": "…"}], "choice": "…", "why": "…",
             "technologies": ["redis"], "patterns": ["hot-keys"],
             "diagram": {"nodes": [{"id": "svc", "kind": "service", "label": "…"}], "edges": []}}],
  "deep_dives": [{"id": "DD1", "title": "…", "options": [{"name": "…", "pros": "…", "cons": "…"}], "choice": "…", "why": "…", "version": 2}],
  "wrapup": {"bottlenecks": "…", "failures": "…", "monitoring": "…", "scale": "…", "future": "…"} }

// estimates.json: rows are evaluated top to bottom; a formula may use earlier row names,
// numbers (1e6), + - * / // % ** ^ ( ) and the constants thousand, million, billion, day, hour, month (seconds)
{ "version": 1, "rows": [{"name": "write_qps", "formula": "100 * million / month", "unit": "/s"}] }
// units: "" count servers | /s qps rps /min /hour /day /month | B KB MB GB TB PB | B/s KB/s MB/s GB/s Gbps | ms s

// diagrams/vN.json (N = 1..20): x/y are canvas positions, ignored by checks
{ "version": 2, "why": "which flaw/requirement this version fixes",
  "nodes": [{"id": "svc", "kind": "service", "label": "Redirect service", "x": 300, "y": 160}],
  "edges": [{"from": "client", "to": "svc", "label": "GET /{code}"}],
  "flows": [{"name": "redirect", "path": ["client", "svc"]}] }
```
Also present: `signatures.py` (signatures only), `notes.md`, and `submitted.json` once submitted.

## Smells (every version; only the final version's smells count against you)
**OOD:** `orphan-class` (no relationships; enums exempt), `unimplemented-interface` (an interface/abstract that no class/abstract points to).
**System design:** `client-to-store`, `orphan-node`, `queue-no-consumer`, `unreachable` (a service, gateway or load
balancer not reachable from a client), `single-store-read-heavy` (flag), `no-load-balancer` (flag),
`part-not-composed` (final version only: a part's node id is missing).

## Check result (`DesignCheck` in `studio/src/api.ts`)
```
{ version, subject, slug, attempt,
  checks: [{id, type, stage, label, passed, detail}],
  stages: {scope|estimates|api|parts|high-level|deep-dives|wrap-up|signatures: {passed, total}},
  passed, total,
  smells: [{rule, message, nodes, version}], final_smells: [...],
  versions: [{version, why, nodes, edges, diff: {added_nodes, removed_nodes, added_edges, removed_edges}, smells: [rule]}],
  versions_missing_why: [int],
  estimates: [{name, formula, unit, value, error}],
  errors: [str], submitted: bool }
```
A recorded check appends a run: `passed/total` = checks, `verdict` = no final smells and every version
has a `why`, and `solution_seen` = the learner had opened this problem's solution (`progress/views.jsonl`).
Session scores use it: 70 × passed/total, +20 for a clean verdict, and +10 for passing on the first real
try, which is not given once the solution was seen.

## API (writes: local studio only, JSON body; design saves up to 256 KB)
| method | path | body | returns |
|---|---|---|---|
| GET | `/api/design/<subject>/<slug>` | | `DesignProblemData` (no reference, tips, keywords or pattern; adds `technologies`, `patterns`, `aka`, `has_solution`) + `status` |
| GET | `/api/design/<subject>/<slug>/solution` | | `DesignReference` (Read mode, always; the UI asks before revealing) |
| POST | `/api/design/<subject>/<slug>/solution-viewed` | `{}` | `{ok}`; logged to `progress/views.jsonl` |
| GET | `/api/design/<subject>/<slug>/<attempt>` | | `DesignAttempt` {name, path, design, estimates, diagrams, signatures, check} |
| GET | `/api/design/<subject>/<slug>/<attempt>/reference` | | `DesignReference` (409 until submitted) |
| POST | `/api/design/<subject>/<slug>/attempt` | `{label?}` | `DesignAttempt` (201) |
| POST | `/api/design/<subject>/<slug>/tip` | `{check, level: nudge\|hint\|show, attempt?}` | `{check, level, text}`; logged to `progress/tips.jsonl` |
| POST | `/api/design/<subject>/<slug>/<attempt>/save` | `{file: design\|estimates\|diagram\|signatures, content, version?}` | `DesignCheck` (live, **not recorded**) |
| POST | `/api/design/<subject>/<slug>/<attempt>/delete-diagram` | `{version ≥ 2}` | `DesignCheck` |
| POST | `/api/design/<subject>/<slug>/<attempt>/check` | `{}` | `DesignCheck`, **recorded** |
| POST | `/api/design/<subject>/<slug>/<attempt>/submit` | `{}` | `DesignCheck`, recorded; unlocks the reference |

Errors are `{error}` with status 400 (bad body), 403 (not the local studio), 404, 409 or 422 (validation).
`/api/problems/<subject>` lists design problems too, and lessons can embed them: a `problems` block in
a design subject resolves to `{type: "design-problems", problems: [{slug, title, difficulty, topics, minutes, attempts}]}`.
