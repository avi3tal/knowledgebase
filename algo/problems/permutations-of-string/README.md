# Permutations of a String

> Difficulty: **medium** · Patterns: backtracking, recursion · Sources: geeksforgeeks, interviewbit, interview:classic

## Problem
Given a string `s` of **distinct** characters, return every permutation (rearrangement) of its
characters, in any order.

## Examples
- `"ABC"` → `["ABC","ACB","BAC","BCA","CAB","CBA"]`
- `"A"` → `["A"]`
- `"AB"` → `["AB","BA"]`

## Constraints
- `1 <= len(s) <= 8` and all characters are distinct.
- The output alone has n! strings of length n, so **O(n · n!)** is optimal. The goal is to avoid
  wasted work, not to beat n!.

## Pattern & how to recognise it
- **"Return all arrangements / combinations / subsets"** → **backtracking**: build the answer one
  position at a time, recurse, then undo the choice.
- The recursion tree has n choices at depth 0, n-1 at depth 1, and so on, which gives n! leaves.
  Its height is n, so the stack is O(n).
- See [algo/notes/patterns.md](../../notes/patterns.md) (Recursion / Backtracking).

## Learning material
- **Backtracking template:** `choose → explore → un-choose`. Two classic ways to "choose" for
  permutations:
  1. **Swap-in-place:** for position `l`, swap each `i in [l..r]` into `l`, recurse on `l+1`,
     then swap back. No extra "used" set is needed.
  2. **Used-flags:** keep `path` and a `used[]` array; at each depth try every unused char.
- Duplicates in the input (`"AAB"`) produce repeated permutations. Sorting plus skipping equal
  siblings fixes that (Permutations II, LeetCode 47).
- Visual explanation: https://www.youtube.com/watch?v=GuTPwotSdYw

## Hints
<details><summary>Hint 1</summary>

Fix the first character, permute the rest, and repeat for every possible first character.
</details>
<details><summary>Hint 2</summary>

After recursing, undo your change so the next branch starts from the same state.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`permute(a, l)`: if `l == len(a)`, record `"".join(a)`. Otherwise, for `i` from `l` to the end:
swap `a[l], a[i]`, call `permute(a, l+1)`, then swap back.
Time O(n · n!), space O(n) recursion (plus the output).
</details>

## Follow-ups
- Input with duplicate characters → unique permutations only (LeetCode 47).
- The k-th permutation without generating all of them (LeetCode 60), using the factorial
  number system.
- The next lexicographic permutation in place (LeetCode 31).
