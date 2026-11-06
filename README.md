# knowledgebase

A personal practice gym for sharpening engineering skills: a local LeetCode/NeetCode-style
console where problems are generated from templates, solved in Python or Go, and run against
predefined cases with a runtime/complexity estimate.

## Layout

The top level is organised by **type** (only `algo` for now; `system-design`, `k8s` later).

```
resources/            ROADMAP.md, links.md (practice platforms = source tags)
progress/             runs.jsonl, quiz.jsonl — your practice history (input to kb feedback)
studio/               React + TS learning studio (served by `kb studio`)
algo/
  learn/              catalog.json (patterns) + one lesson dir per topic
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

## Learning studio

The loop is learn → see it move → recognise it → practise → get feedback.

```sh
make studio            # build the UI and serve it on http://127.0.0.1:8765
# or: ./kb studio  +  (cd studio && yarn dev)   for UI hot reload
```

- **Lessons** (`algo/learn/<topic>/`):
  - markdown on the pattern;
  - **animated step-through traces** of reference code, with pointers, window, hash map and
    variables, recorded deterministically by `./kb learn build`;
  - a "which pattern?" quiz, graded by kb;
  - practice problems, easy → hard.
- **Patterns catalogue** (`algo/learn/catalog.json`): the 23 coding patterns from the
  DesignGurus PDF plus fundamentals. Every problem tag maps to a catalogue topic.
- **Feedback** (`./kb feedback`, the studio dashboard) is computed from `progress/runs.jsonl`
  (every `kb run`) and `progress/quiz.jsonl` (every quiz answer):
  - solved / failing / untried counts, complexity misses and quiz accuracy;
  - spaced-review dates and what to practise next.
  - No AI is involved.
- **Debugging in VS Code:** open a `solution.py` / `solution.go` and press F5, choosing
  "kb: debug Python/Go attempt". `Cmd+Shift+B` runs the "kb: run current attempt" task.
- **New lessons:** `/learn algo two-pointers` in Claude Code writes the content once and kb does
  the rest. `/learn feedback` summarises your progress.

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

## History

Solutions from 2017–2025 that used to live in source folders (`leetcode/`, `interviewbit/`,
`geeksforgeeks/`, `educative/`, `courses/`, `Interviews/`, `ds/`, `recursion/`, `2026/`) were
migrated into `algo/problems/*/attempts/*_legacy*`. The code was kept as written. Bugs found
during the migration are listed in each attempt's `notes.md` and left failing, as practice
material. `git log --follow` on a `solution.py` shows its original history. See
[algo/problems/INDEX.md](algo/problems/INDEX.md).
