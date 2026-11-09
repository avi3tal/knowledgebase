# Project conventions

## Stack decisions (approved 2026-11-06)
- Tooling (`tools/`, generator + runner CLI): **Python 3, stdlib only**.
- Solutions: **Python** or **Go**. Go code lives under the root `go.mod` (module `knowledgebase`);
  each attempt dir is its own package and is tested with `go test` (table-driven, reads `cases.json`).
- Subjects: **algo** (coding problems, Python/Go), **system-design** and **ood** (design problems in the
  studio's design console; format and API contract in `system-design/FORMAT.md`, checker `tools/kb/design.py`,
  `kb sd validate` is the content gate). System design is practised as **decompose → reduce** (parts merged
  into the high-level design by node id) and every `reference.md` follows FORMAT.md's fixed solution layout.
  Studio pages for design problems use the shared `Workbench` layout (header / tabs / left | center | right / footer).
  **genai** (LLM systems) and **platform** (containers, Kubernetes, cloud, delivery) are catalog-only subjects
  (status `locked`) until they get lessons and problems.
- **Learn vs Practice (2026-11-08):** catalog topics are what you learn; problems are what you practise.
  Case studies are problems, never catalog topics (`case-study` kind is rejected). Problem→topic links come
  only from `learn.problem_topics` (algo `patterns`; design `topics`/`technologies`/`design_patterns` = role).
  No empty pages: a topic is `lesson`, `practice-only` or `planned` (planned = not linkable).
- Learning studio (approved 2026-11-06): **React + TypeScript (strict) + Vite** app in `studio/`,
  package manager **yarn** (v4, `nodeLinker: node-modules`). The Python `kb` CLI is its local
  backend (`kb studio`, stdlib HTTP server on 127.0.0.1) and the only thing that touches files.
- **Deterministic first:** traces, quiz grading, progress and feedback are computed by kb. Claude
  writes lesson content once (stored in the repo) and does code review only when asked.

## Layout rules
- Top level = type (`algo/`, `system-design/`, `ood/`, `genai/`, `platform/`). Never organise by source or by year.
- **Content vs private data.** The repo ships content only (problems, lessons, resources, tools) so
  anyone can clone it and learn. Everything a learner produces lives in their private, git-ignored
  workspace `_workspace/` (`KB_WORKSPACE` overrides; Go attempts must stay inside the repo):
  `attempts/<subject>/<slug>/<attempt>/`, `progress/*.jsonl`, `sessions/<id>/`. Never commit it, and
  never make committed content (INDEX.md, READMEs) depend on it.
- `algo/problems/<slug>/` holds README.md, meta.json and cases.json (no attempts).
- Attempt dir name: `<YYYY-MM-DD>_<lang>_<pattern-or-legacy>`.
- Source (leetcode, interviewbit, interview:<company>…) is a tag in `meta.json` `sources`.
- No `__init__.py` packages: solutions are self-contained and loaded by file path.
- Learning material goes in `algo/notes/`, reusable DS implementations in `algo/ds/`.

## Tooling
- `./kb` CLI (`tools/kb/`, Python stdlib) + `tools/gokb/` (Go harness helpers). Templates in `templates/algo/`.
- Lessons / feedback: the `/learn` skill (`.claude/skills/learn/SKILL.md`); reference lesson is
  `algo/learn/sliding-window/`. `kb learn build|validate`, `kb studio`, `kb feedback`, `kb debug`.
- Trace JSON is the Python↔TS contract (`tools/kb/trace.py` ↔ `studio/src/trace.ts`); both test
  against `tools/tests/testdata/trace_fixture.json` — regenerate it when the format changes.
- History lives in `_workspace/progress/*.jsonl` (private). Tests run against an empty `KB_WORKSPACE` and
  `KB_PROGRESS_DIR` (conftest does); fixture attempts live in `tools/tests/testdata/workspace/`.
- New problems / attempts: the `/new-problem` skill (`.claude/skills/new-problem/SKILL.md`).
- Study sessions: `kb session new|list|show|start|done|abandon|attempt` (`tools/kb/sessions.py`,
  deterministic generator; scores derived from runs, never stored). Claude plans go through
  `kb session new --plan` via the `/session` skill. Tutor feedback on demand: `/review` → `review.md`.
- Generated files (`solution_test.go`, `kb_types.go`) are rewritten by `kb run`; edit `meta.json` instead.
- Test fixtures for the tooling live in `tools/tests/testdata/problems/` (Go ignores `testdata` in `./...`).
- Checks: `make test`, `make lint`. Python dev tools run via `uvx` (pytest, ruff).

## Style
- Python: type hints, ruff (format + lint; format on save in VS Code). Go: gofmt, wrap errors with `%w`, table-driven tests.
- Studio UI (2026-11-09 facelift): one top bar (`TopBar`), every page = `Workbench` + `PageHeader` (title, one
  meta line, one primary action, tabs on the header edge) + slim prev/next footer. No breadcrumbs, no emoji in
  chrome (icons from `components/Icon.tsx`), tokens only from `styles.css :root`.
- Content: every code fence names its language (Shiki highlighting); diagrams are figures (architecture,
  sequence, flowchart, uml, structure), never ASCII art — `tools/kb/mdlint.py` enforces it.
