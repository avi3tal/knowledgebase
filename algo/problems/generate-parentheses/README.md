# Generate Parentheses

> Difficulty: **medium** · Patterns: subsets, backtracking · Sources: [leetcode](https://leetcode.com/problems/generate-parentheses/)

## Problem
Given `n` pairs of parentheses, return every string of `n` opening and `n` closing parentheses
that is **well-formed** (balanced), in any order.

## Examples
- `n = 3` → `["((()))","(()())","(())()","()(())","()()()"]`
- `n = 1` → `["()"]`
- `n = 2` → `["(())","()()"]`

## Constraints
- `1 <= n <= 8`.

## Pattern & how to recognise it
- "Generate **all** valid strings" built one character at a time, where each step has a small
  set of choices (`(` or `)`) → **Subsets**-style generation (BFS over partial strings) or
  **Backtracking** (DFS). The validity rule lets you drop a partial string as soon as it breaks.
- Generating all `2^(2n)` strings and filtering is the naive version. The rules below prune
  invalid prefixes immediately.
- Lesson: [Subsets — variants](../../learn/subsets/02-variants.md).

## Learning material
- A prefix can still become valid iff `open <= n` and `close <= open`. So you may add `(` while
  `open < n`, and `)` while `close < open`.
- Keep `(prefix, open, close)` per partial string in a queue (BFS) or as recursion arguments
  (DFS).
- The count of answers is the n-th Catalan number: 1, 2, 5, 14, 42, 132, …
- [LeetCode 22](https://leetcode.com/problems/generate-parentheses/).

## Hints
<details><summary>Hint 1</summary>

Build strings left to right. When is adding `)` illegal?
</details>
<details><summary>Hint 2</summary>

Track how many `(` and `)` each partial string has used.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Queue of `(s, open, close)` starting with `("", 0, 0)`. Pop one: if `len(s) == 2n`, record it.
Otherwise push `(s+"(", open+1, close)` if `open < n`, and `(s+")", open, close+1)` if
`close < open`. Time and space O(4^n / sqrt(n)), proportional to the number of answers times
their length.
</details>

## Follow-ups
- Valid Parentheses (`valid-parentheses`): checking instead of generating.
- Count the answers only (Catalan numbers, DP).
