---
name: new-problem
description: Generate a practice problem in this repo (LeetCode/NeetCode style) — statement, learning material, pattern classification, hints, signature, test cases and complexity benchmark — or start a new practice attempt of an existing problem. Use when the user says "new problem", "give me a <pattern> problem", "practice <problem> in go/python", or invokes /new-problem.
argument-hint: <type> <lang> <problem name | pattern [difficulty]>
---

# /new-problem — generate a practice problem

Arguments: `<type> <lang> <what>`
- `type`: `algo` (the only type supported for now; refuse others and say they're planned).
- `lang`: `python` or `go`.
- `what`: a known problem ("two sum", "LRU cache", a URL) **or** a pattern (+ optional difficulty),
  e.g. `sliding-window medium` → pick a fitting classic problem the user hasn't done yet
  (check `./kb list --pattern <pattern>`).

Everything is driven by the `./kb` CLI (repo root). Layout and rules: see `CLAUDE.md` and `README.md`.

## 1. Already exists? → just a new attempt
Derive the kebab-case slug (`two-sum`, `lru-cache`). If `algo/problems/<slug>/` exists, skip to step 5.
Re-practising the same problem with a different language or pattern is the point of attempts.

## 2. Scaffold
```
./kb new <slug> --difficulty easy|medium|hard --pattern <p> [--pattern <p2>] --source <name>=<url>
```
Pattern tags are kebab-case and reused across problems — check existing ones with `./kb list` and
`algo/notes/patterns.md` before inventing a new tag. Common: `arrays-hashing`, `hashmap`, `two-pointers`,
`sliding-window`, `stack`, `monotonic-stack`, `binary-search`, `linked-list`, `fast-slow-pointers`,
`tree-dfs`, `tree-bfs`, `trie`, `heap`, `backtracking`, `graph-bfs`, `graph-dfs`, `union-find`,
`topological-sort`, `dp-1d`, `dp-2d`, `greedy`, `intervals`, `bit-manipulation`, `math`, `sorting`, `design`.
Source names come from `resources/links.md` (`leetcode`, `neetcode`, `interviewbit`, `interview:<company>`…).

## 3. Write the content (you author these three files)

**`README.md`** — fill every template section and delete the `<!-- ... -->` placeholder comments
(`kb validate` rejects leftovers). Never include solution code.
- Problem, Examples (with explanation), Constraints (they hint at the target complexity).
- *Pattern & how to recognise it*: the concrete signals in the statement → pattern, and why the naive
  approach is too slow. Link the matching note in `algo/notes/` if one exists.
- *Learning material*: a short, self-contained explanation of the concept / data structure needed
  (with the complexity of its operations) plus 1–2 reputable links.
- *Hints*: 2–3 progressive hints, each inside `<details>`.
- *Approach (spoiler)*: prose/pseudocode only, inside `<details>`, with time/space complexity.
- *Follow-ups*: variations interviewers ask.

**`meta.json`** — the signature drives the stubs and the Go test harness:
- `kind: "function"`: `function` (camelCase), `params: [{name, type}]`, `returns`.
  In-place problems: `"returns": "void", "output": "<param name>"`.
- `kind: "design"` (LRU cache, stream classes…): `class` (PascalCase),
  `constructor: {params}`, `methods: [{name (camelCase), params, returns}]`.
- Types: `int float string bool ListNode TreeNode`, plus `[]` / `[][]` (e.g. `int[][]`, `ListNode[]`).
  Python sees `snake_case` names; Go sees the camelCase function, or `New<Class>` + exported methods.
- `comparator`: `exact` | `unordered` (any order of a list answer) | `unordered_deep` (e.g. group
  anagrams, subsets) | `float` | `any_of` (`expected` lists every acceptable answer).
- `expected_complexity`: optimal `{time, space}` as `O(...)` in terms of `n` (replace the `O(?)` placeholders).
- `patterns`: replace the `todo` placeholder if you scaffolded without `--pattern`.
- `bench` (function problems only): `{"args": {param: generator-expr}}` producing a worst-ish input of
  size `n`. Available: `n`, `int_array(size, lo, hi)`, `sorted_int_array`, `distinct_int_array`,
  `int_matrix(rows, cols, lo, hi)`, `string(size, alphabet)`, `string_array(count, length)`,
  `rand_int(lo, hi)`, `linked_list(size)`, `bst(size)`, `tree(size)`, `isqrt(x)`. Optional `min_n` /
  `max_n` (default 256..131072) or explicit `sizes`. Make the input force the full work (e.g. a target
  that is never found). Exponential problems: small explicit `sizes`. Omit `bench` if no single `n` fits.

**`cases.json`** — 6–12 cases, each with a descriptive `name`:
- function: `{"name", "args": {param: value}, "expected"}`; design:
  `{"name", "ctor": [...], "ops": [...], "op_args": [[...]], "expected": [...]}` (`null` for void ops).
- Cover: the statement's examples, minimal input, empty / single element, duplicates, negatives,
  all-equal, sorted / reverse-sorted, no-solution, and one larger tricky case.
- Lists/trees are arrays (trees level-order with `null`). **Verify every expected value by working it
  through** — a wrong case is worse than a missing one.

## 4. Validate
`./kb validate <slug>` must print ✓. Fix and repeat.

## 5. Start the attempt
```
./kb attempt <slug> --lang <lang> --pattern <pattern-being-practised>
./kb index
```
Then tell the user briefly: title, difficulty, patterns, the README path, the stub path, and
`./kb run <slug>`. Don't solve it and don't reveal hints unless asked.

## Reviewing an attempt (when asked)
Run `./kb run <slug> <attempt>`, then review correctness, measured vs `expected_complexity`, and
idiomatic style; offer improvements as hints first. Write takeaways to the attempt's `notes.md` only if
the user asks.
