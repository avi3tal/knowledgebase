# Project conventions

## Stack decisions (approved 2026-11-06)
- Tooling (`tools/`, generator + runner CLI): **Python 3, stdlib only**.
- Solutions: **Python** or **Go**. Go code lives under the root `go.mod` (module `knowledgebase`);
  each attempt dir is its own package and is tested with `go test` (table-driven, reads `cases.json`).
- v1 scope: problem type **algo** only.
- Learning studio (approved 2026-11-06): **React + TypeScript (strict) + Vite** app in `studio/`,
  package manager **yarn** (v4, `nodeLinker: node-modules`). The Python `kb` CLI is its local
  backend (`kb studio`, stdlib HTTP server on 127.0.0.1) and the only thing that touches files.
- **Deterministic first:** traces, quiz grading, progress and feedback are computed by kb. Claude
  writes lesson content once (stored in the repo) and does code review only when asked.

## Layout rules
- Top level = type (`algo/`, later `system-design/`, `k8s/`). Never organise by source or by year.
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
- Generated files (`solution_test.go`, `kb_types.go`) are rewritten by `kb run`; edit `meta.json` instead.
- Test fixtures for the tooling live in `tools/tests/testdata/problems/` (Go ignores `testdata` in `./...`).
- Checks: `make test`, `make lint`. Python dev tools run via `uvx` (pytest, ruff).

## Style
- Python: type hints, ruff (format + lint; format on save in VS Code). Go: gofmt, wrap errors with `%w`, table-driven tests.
