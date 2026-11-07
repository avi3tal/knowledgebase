# knowledgebase

A local, clone-and-run interview-prep platform: animated lessons, a knowledge graph of curated
resources, LeetCode/NeetCode-style problems solved in **your own editor** (Python or Go) and run
against predefined cases with a runtime/complexity estimate, plus deterministic feedback.

**Your work stays yours.** The repo ships content and tools only. Your attempts, run history,
quiz answers and study sessions live in `_workspace/` (git-ignored, created on first use), so you
can pull platform updates without conflicts and keep your progress private. Use your own tools
and, if you want AI help, your own Claude Code and API keys.

## Layout

The top level is organised by **subject**: `algo/` (coding patterns and problems), `system-design/` and
`ood/` (lessons + design-console case studies); `k8s` later.

```
resources/            sources.json (registry + verdicts), refs/ (curated references), README.md, ROADMAP.md
_workspace/           YOUR private data (git-ignored): attempts/, progress/*.jsonl, sessions/
studio/               React + TS learning studio (served by `kb studio`)
algo/
  learn/              catalog.json (patterns) + one lesson dir per topic
  notes/              learning material per topic (patterns, complexity, heaps, sorting, trees…)
  ds/                 reference implementations of data structures & classic algorithms
  problems/<slug>/    one canonical problem definition
    README.md         statement, learning material, tips, pattern rationale
    meta.json         difficulty, patterns[], sources[], signature, expected complexity
    cases.json        language-neutral test cases
templates/            problem/attempt templates per type & language
tools/                `kb` CLI: generate problems/attempts, run & evaluate
archive/              leftovers that are not (yet) a problem type
```

- A **problem** is defined once; you can practise it many times as new **attempts**
  (different language, pattern or day), stored in
  `_workspace/attempts/<subject>/<slug>/<date>_<lang>_<pattern>/`.
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
- **Feedback** (`./kb feedback`, the studio dashboard) is computed from `_workspace/progress/runs.jsonl`
  (every `kb run`) and `_workspace/progress/quiz.jsonl` (every quiz answer):
  - solved / failing / untried counts, complexity misses and quiz accuracy;
  - spaced-review dates and what to practise next.
  - No AI is involved.
- **Debugging in VS Code:** open a `solution.py` / `solution.go` and press F5, choosing
  "kb: debug Python/Go attempt". `Cmd+Shift+B` runs the "kb: run current attempt" task.
- **New lessons:** `/learn algo two-pointers` in Claude Code writes the content once and kb does
  the rest. `/learn feedback` summarises your progress.

## System design and OOD console

Design problems (`system-design/problems/`, `ood/problems/`) open in the studio's console: scope →
estimates (live calculator) → API & data → a **Visio-like canvas** with versions v1 → vN (each with a
"why", diffs highlighted) → deep dives with trade-offs → wrap-up → signatures. A rubric checklist
updates as you work; structural **smells** (client talking to a DB, a queue nobody reads, one DB under
a read-heavy load, an interface nothing implements…) are flagged; tips come on demand (nudge → hint
→ show). **Check** records a run; **Submit** unlocks the reference walkthrough and diagrams. No AI.

```sh
./kb sd list [--subject ood]               # case studies
./kb sd attempt url-shortener              # or start it from the studio
./kb run _workspace/attempts/system-design/url-shortener/<attempt>   # checklist + smells in the terminal
./kb sd tip url-shortener comp-cache --level hint
./kb sd validate                           # content gate for authors (reference must pass every check)
```

## Study sessions

A session is a scoped, targeted set of lessons and problems with a score per problem and for the
whole session.

```sh
./kb session new --topics sliding-window,two-pointers --difficulty easy,medium --count 5 --focus weak \
                 --goal "onsite in 2 weeks"          # deterministic picks from your history
./kb session list                                     # status, completion, score
./kb session attempt <id> --item p1 --lang go         # start a problem of the session
./kb session start|done|abandon <id>
```

Or open 🎯 **Sessions** in the studio. In Claude Code, `/session` reads your progress and past
sessions, explains strengths and weak spots, and writes a plan that kb validates and saves.
`/review <slug>` gives tutor feedback on one attempt (on demand, written to `review.md`).
Per-problem score: 70 for passing cases, +20 for the target complexity, +10 for passing on your
first real try (running the empty stub first doesn't count); re-runs update it.

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
from `meta.json`, so `go test ./_workspace/attempts/algo/<slug>/<attempt>` also works on its own.
Unsolved Go stubs fail their tests by design (red → green).

Development: `make test` (pytest via uvx + go vet/test), `make lint`, `make fmt`.

## History

Solutions from 2017–2025 that used to live in source folders (`leetcode/`, `interviewbit/`,
`geeksforgeeks/`, `educative/`, `courses/`, `Interviews/`, `ds/`, `recursion/`, `2026/`) were
migrated into the problem format; the owner's attempts (`*_legacy*`) then moved to their private
workspace on 2026-11-07, when the repo became a clone-and-run platform. Older commits still hold
them. Every problem keeps its statement, cases and learning material. See
[algo/problems/INDEX.md](algo/problems/INDEX.md).
