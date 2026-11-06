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

> Refactor in progress: legacy folders (`leetcode/`, `interviewbit/`, `geeksforgeeks/`,
> `educative/`, `courses/`, `Interviews/`, `ds/`, `recursion/`, `2026/`, `algo/problems/*.py`)
> are being migrated into `algo/problems/`.
