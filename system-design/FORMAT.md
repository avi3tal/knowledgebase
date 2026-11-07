# Design problems: file format and API contract (v1)

This is the contract between content (`<subject>/problems/<slug>/`), the checker (`tools/kb/design.py`),
the API (`tools/kb/server.py`) and the studio console (`studio/src/api.ts` → `Design*` types). It applies
to `system-design` and `ood`. `./kb sd validate [slug] [--subject ood]` enforces the content rules.
The shared fixture `tools/tests/testdata/design_check_fixture.json` is a real check result; pytest and
vitest both read it, so regenerate it when the shape changes.

## Content: `<subject>/problems/<slug>/`

| file | what |
|---|---|
| `README.md` | Prompt plus what the interviewer says if asked (numbers!) and "things worth deciding". **No answers.** |
| `meta.json` | `{title, difficulty: easy\|medium\|hard, kind: "design", topics: [catalog ids], sources: [{name}], minutes}` |
| `rubric.json` | `{version: 1, flags: {read_heavy?, needs_lb?}, pattern: "transferable lesson", checks: [...]}` |
| `reference.md` | Walkthrough in our own words: scope → estimates → API/data → v1→vN → deep dives → wrap-up → transferable pattern. Spoiler. |
| `reference/` | A complete attempt (`design.json`, `estimates.json`, `diagrams/v1.json…`, optional `signatures.py`). It **must pass every check with no smells in its final version**, and must evolve over at least two versions, each with a `why`. |

### Rubric checks
Every check has `id` (kebab), `type`, `label` and `tips: {nudge, hint, show}`.
- **Labels are shown before submit, so they must not give the answer away.** Write "Read path can
  absorb the read load", not "Add a Redis cache".
- **Keywords** are case-insensitive substrings. Be generous with synonyms and spellings; tips cover
  the gaps.

| type | stage | extra fields | passes when |
|---|---|---|---|
| `requirement` | scope | `keywords` | any scope item (functional, non-functional, assumptions, out of scope) contains a keyword |
| `estimate` | estimates | `keywords`, `unit`, `min`, `max` | a row whose *name* contains a keyword evaluates, converted to `unit`, within [min, max] |
| `endpoint` | api | `keywords`, `method?` | an api row (same method, if given) contains a keyword |
| `entity` | api | `keywords` | a data row contains a keyword |
| `component` | high-level | `kinds`, `keywords?` | the **final** diagram has a node of one of `kinds` (and a label/id keyword, if given) |
| `edge` | high-level | `from_kinds`, `to_kinds` | the final diagram has an edge from a `from_kinds` node to a `to_kinds` node |
| `decision` | deep-dives | `keywords` | a deep dive mentions a keyword **and** has a non-empty `choice` and `why` |
| `wrapup` | wrap-up | `key` ∈ bottlenecks, failures, monitoring, scale, future | that wrap-up answer has ≥ 15 chars |
| `signature` | signatures | `names` | `signatures.py` (classes/defs) or `signatures.go` (types/funcs) declares every name |

Aim for 12–20 checks per system design problem, covering every stage. OOD problems lean on
`component` (class kinds), `edge` and `signature`.

**Flags** turn on smell rules: `read_heavy` → `single-store-read-heavy`; `needs_lb` → `no-load-balancer`.

## Palettes (node `kind`)
- **system-design:** client, dns, cdn, load-balancer, api-gateway, service, worker, scheduler, cache,
  sql, nosql, blob, search, queue, stream, coordinator, external
- **ood:** actor, class, abstract, interface, enum

## Attempt: `<workspace>/attempts/<subject>/<slug>/<YYYY-MM-DD>_design_<label>/`

```jsonc
// design.json
{ "version": 1,
  "scope": { "functional": [{"id": "F1", "text": "…"}], "non_functional": [...], "assumptions": [...], "out_of_scope": [...] },
  "api":  [{"id": "E1", "method": "POST", "path": "/urls", "request": "…", "response": "…", "notes": "…"}],
  "data": [{"id": "D1", "name": "links", "fields": "…", "store": "nosql", "why": "…"}],
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

## Smells (system-design, every version; only the final version's smells count against you)
`client-to-store`, `orphan-node`, `queue-no-consumer`, `unreachable` (a service, gateway or load
balancer not reachable from a client), `single-store-read-heavy` (flag), `no-load-balancer` (flag).

## Check result (`DesignCheck` in `studio/src/api.ts`)
```
{ version, subject, slug, attempt,
  checks: [{id, type, stage, label, passed, detail}],
  stages: {scope|estimates|api|high-level|deep-dives|wrap-up|signatures: {passed, total}},
  passed, total,
  smells: [{rule, message, nodes, version}], final_smells: [...],
  versions: [{version, why, nodes, edges, diff: {added_nodes, removed_nodes, added_edges, removed_edges}, smells: [rule]}],
  versions_missing_why: [int],
  estimates: [{name, formula, unit, value, error}],
  errors: [str], submitted: bool }
```
A recorded check appends a run: `passed/total` = checks, `verdict` = no final smells and every version
has a `why`. Session scores use it: 70 × passed/total, +20 for a clean verdict, +10 for passing on the
first real try.

## API (writes: local studio only, JSON body; design saves up to 256 KB)
| method | path | body | returns |
|---|---|---|---|
| GET | `/api/design/<subject>/<slug>` | | `DesignProblemData` (no reference, tips, keywords or pattern) + `status` |
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
