# Project conventions

## Stack decisions (approved 2026-11-06)
- Tooling (`tools/`, generator + runner CLI): **Python 3, stdlib only**.
- Solutions: **Python** or **Go**. Go code lives under the root `go.mod` (module `knowledgebase`);
  each attempt dir is its own package and is tested with `go test` (table-driven, reads `cases.json`).
- v1 scope: problem type **algo** only.

## Layout rules
- Top level = type (`algo/`, later `system-design/`, `k8s/`). Never organise by source or by year.
- `algo/problems/<slug>/` holds README.md, meta.json, cases.json and `attempts/`.
- Attempt dir name: `<YYYY-MM-DD>_<lang>_<pattern-or-legacy>`.
- Source (leetcode, interviewbit, interview:<company>…) is a tag in `meta.json` `sources`.
- No `__init__.py` packages: solutions are self-contained and loaded by file path.
- Learning material goes in `algo/notes/`, reusable DS implementations in `algo/ds/`.

## Style
- Python: type hints, black/ruff. Go: gofmt, wrap errors with `%w`, table-driven tests.
