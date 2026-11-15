# Longest Repeating Substring

> Difficulty: **medium** · Patterns: longest-common-substring, dp-2d · Sources: [leetcode](https://leetcode.com/problems/longest-repeating-substring/)

## Problem
Given a string `s`, return the length of the longest substring that occurs **at least twice** in
`s`. The occurrences may overlap. Return `0` if no substring repeats.

## Examples
- `s = "abbaba"` → `2`. Both `"ab"` and `"ba"` occur twice; no length-3 substring repeats.
- `s = "aabcaabdaab"` → `3`. `"aab"` occurs three times.
- `s = "aaaaa"` → `4`. `"aaaa"` starts at index 0 and at index 1; overlapping occurrences count.

## Constraints
- `1 <= len(s) <= 2000`, lowercase letters.
- O(n^2) time is fine. Collecting every substring in a set is O(n^3) time and memory, which is not.

## Pattern & how to recognise it
- "A substring that appears twice" means comparing the string with **itself** at two different
  start positions. This is Longest Common Substring of `s` and `s`, where only pairs `i != j` count.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/01-intro.md).

## Learning material
- `dp[i][j]` (for `i < j`) = length of the common run ending at `s[i-1]` and `s[j-1]`. It equals
  `dp[i-1][j-1] + 1` when the characters match, else `0`. The answer is the maximum cell.
- **Why only `i < j`?** The diagonal `i == j` compares a position with itself and is always a
  "match". You must skip it, or every answer becomes `len(s)`.
- **Second view:** the answer is *monotonic*. If a length-`L` substring repeats, so does a length
  `L-1` one (drop its last character). So you can binary search `L` and check each length with a set
  of hashed windows. That is the road to [Longest Duplicate Substring](../longest-duplicate-substring/README.md).
- Reading: [LeetCode 1062 discussion](https://leetcode.com/problems/longest-repeating-substring/).

## Hints
<details><summary>Hint 1</summary>

Pretend you have two copies of `s`. What does a repeated substring look like in a common-substring
table?
</details>
<details><summary>Hint 2</summary>

Which cells of that table must you ignore?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Run the longest-common-substring DP of `s` against `s`, over pairs `i < j` only. Keep a single row
and iterate `j` from right to left, so the diagonal neighbour is still the previous row's value.
Return the best length.

Expected complexity: time O(n^2), space O(n).

Alternative: binary search `L` in `[0, n)`. Test each `L` with a set of the substrings or hashes of
that length: O(n log n) with rolling hashes.
</details>

## Follow-ups
- Return the substring, not the length: [Longest Duplicate Substring](../longest-duplicate-substring/README.md).
- Require **non-overlapping** occurrences: add the condition `dp < j - i`.
- Count the distinct substrings that repeat.
