# knowledgebase

A personal practice gym for sharpening engineering skills: a local LeetCode/NeetCode-style
console where problems are generated from templates, solved in Python or Go, and run against
predefined cases with a runtime/complexity estimate.

## Layout

The top level is organised by **type** (only `algo` for now; `system-design`, `k8s` later).

```
resources/            ROADMAP.md, links.md (practice platforms = source tags)
algo/
  notes/              learning material per topic (patterns, complexity, heaps, sorting, trees…)
  ds/                 reference implementations of data structures & classic algorithms
  problems/<slug>/    one canonical problem definition
    README.md         statement, learning material, tips, pattern rationale
    meta.json         difficulty, patterns[], sources[], signature, expected complexity
    cases.json        language-neutral test cases
    attempts/<date>_<lang>_<pattern>/   one solution session (solution + notes.md)
templates/            problem/attempt templates per type & language
tools/                `kb` CLI: generate problems/attempts, run & evaluate
archive/              leftovers that are not (yet) a problem type
```

- A **problem** is defined once; you can practise it many times as new **attempts**
  (different language, pattern or day).
- Where a problem came from (leetcode, interviewbit, an interview…) is a `sources` tag in
  `meta.json`, not a folder.

## Usage

In Claude Code: `/new-problem algo go sliding-window medium` or `/new-problem algo python "two sum"`.
Claude writes the statement, learning material, pattern tags, hints, signature and cases, then
creates an attempt stub for you to solve.

The CLI (Python 3 stdlib, no install):

```sh
./kb new <slug> --difficulty easy --pattern two-pointers --source leetcode=https://...
./kb validate <slug>                         # check meta.json / cases.json
./kb attempt <slug> --lang go --pattern two-pointers   # new practice session (stub + notes.md)
./kb run <slug> [attempt] [--all] [--no-bench]          # run cases + estimate complexity
./kb list [--pattern heap]
./kb index                                   # regenerate algo/problems/INDEX.md
```

`kb run` checks every case and shows the diff for any that fail. It then benchmarks the solution
over growing `n` and prints the estimated complexity next to the expected one, for example
`≈ O(n) … expected O(n) ✓ consistent`. The verdict comes from the log-log slope, so it is an
estimate: it separates O(n) from O(n²) reliably, but not O(n) from O(n log n). Every run is
appended to the attempt's `notes.md`.

Go attempts are packages under the root `go.mod`. kb generates a table-driven `solution_test.go`
from `meta.json`, so `go test ./algo/problems/<slug>/attempts/<attempt>` also works on its own.
Unsolved Go stubs fail their tests by design (red → green).

Development: `make test` (pytest via uvx + go vet/test), `make lint`, `make fmt`.

> Refactor in progress: legacy folders (`leetcode/`, `interviewbit/`, `geeksforgeeks/`,
> `educative/`, `courses/`, `Interviews/`, `ds/`, `recursion/`, `2026/`, `algo/problems/*.py`)
> are being migrated into `algo/problems/`.
