# Unique Generalized Abbreviations

> Difficulty: **medium** · Patterns: subsets, backtracking · Sources: [leetcode](https://leetcode.com/problems/generalized-abbreviation/)

## Problem
A generalized abbreviation of a word replaces any set of characters with counts: each maximal
run of replaced characters becomes the number of characters in it. Given `word`, return every
generalized abbreviation, in any order.

## Examples
- `word = "BAT"` → `["BAT","BA1","B1T","B2","1AT","1A1","2T","3"]`
- `word = "a"` → `["a","1"]`
- `"code"` has 16 abbreviations, e.g. `"c2e"` (o and d replaced) and `"1o1e"` (c and d replaced).

## Constraints
- `1 <= len(word) <= 15`, lowercase or uppercase English letters.
- Two adjacent counts never appear: `"11T"` is not valid, it's written `"2T"`.

## Pattern & how to recognise it
- Each character is either **kept** or **abbreviated**: a two-way choice per position, so there
  are `2^n` results → **Subsets** (BFS over partial abbreviations).
- The twist: abbreviated characters next to each other merge into one count, so a partial state
  needs a pending count, not just a string.
- Lesson: [Subsets — variants](../../learn/subsets/02-variants.md).

## Learning material
- State per partial result: `(prefix string, start index, pending count)`. Skipping a character
  increments the count; keeping it flushes the count (if non-zero) and appends the character.
- When `start` reaches the end, flush the count and record the string.
- [LeetCode 320 (premium)](https://leetcode.com/problems/generalized-abbreviation/); the PDF calls
  it *Unique Generalized Abbreviations*.

## Hints
<details><summary>Hint 1</summary>

Why does the answer always have exactly `2^n` strings?
</details>
<details><summary>Hint 2</summary>

Don't write the number as soon as you abbreviate a character. Carry a count until you keep a
character or reach the end.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

BFS queue of `(builder, start, count)` from `("", 0, 0)`. Pop one: if `start == n`, append
`builder + (str(count) if count else "")` to the result. Otherwise push two states: abbreviate
→ `(builder, start+1, count+1)`; keep → `(builder + (str(count) if count else "") + word[start],
start+1, 0)`. Time and space O(n · 2^n).
</details>

## Follow-ups
- Valid Word Abbreviation (LeetCode 408): check one abbreviation against a word.
- Minimum Unique Word Abbreviation (LeetCode 411, hard).
