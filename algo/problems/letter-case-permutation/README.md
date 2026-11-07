# Letter Case Permutation

> Difficulty: **medium** · Patterns: subsets, backtracking · Sources: [leetcode](https://leetcode.com/problems/letter-case-permutation/)

## Problem
Given a string `s` of letters and digits, you may change any letter to lowercase or uppercase.
Return every string you can create this way, in any order. Digits stay as they are.

## Examples
- `s = "a1b2"` → `["a1b2","a1B2","A1b2","A1B2"]`
- `s = "3z4"` → `["3z4","3Z4"]`
- `s = "12345"` → `["12345"]` (no letters, one string)

## Constraints
- `1 <= len(s) <= 12`, `s` has only English letters and digits.

## Pattern & how to recognise it
- "Return **all** strings you can make" where each position is an independent two-way choice →
  **Subsets** (BFS). Every letter doubles the number of strings; a digit leaves it unchanged.
- It's the same shape as "all subsets": choose "lower" or "upper" for each letter instead of
  "skip" or "take".
- Lesson: [Subsets](../../learn/subsets/01-intro.md).

## Learning material
- Level-by-level generation: keep the list of strings built so far. For each letter, every
  existing string gets cloned once with the other case at that position.
- `swapcase()` / `strings.ToUpper` on a single character flips its case.
- [LeetCode 784](https://leetcode.com/problems/letter-case-permutation/).

## Hints
<details><summary>Hint 1</summary>

Start with `[s]`. Which positions can create new strings?
</details>
<details><summary>Hint 2</summary>

At a letter at index `i`, every string you have so far produces one copy with position `i`
case-flipped.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`result = [s]`. For each index `i` where `s[i]` is a letter: for every string `t` currently in
`result` (frozen count), append `t` with `t[i]` swapped to the other case. Time O(n · 2^L)
where `L` is the number of letters, space the same for the output.
</details>

## Follow-ups
- Do it with recursion (DFS) and a char array you flip and flip back, to avoid building
  intermediate strings.
- Count the results without generating them (`2^letters`).
