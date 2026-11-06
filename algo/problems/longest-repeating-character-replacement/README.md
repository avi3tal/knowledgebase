# Longest Repeating Character Replacement

> Difficulty: **medium** · Patterns: sliding-window · Sources: [leetcode](https://leetcode.com/problems/longest-repeating-character-replacement/)

## Problem
You're given a string `s` of uppercase letters and an integer `k`. You may change at most `k`
characters to any other uppercase letter. Return the length of the longest substring
containing a single repeated letter that you can obtain.

## Examples
- `s = "ABAB", k = 2` → `4` (change both A's, or both B's)
- `s = "AABABBA", k = 1` → `4` (`"AABA"` → `"AAAA"`)
- `s = "AABBB", k = 0` → `3`

## Constraints
- `1 <= len(s) <= 10^5`, uppercase English letters only, `0 <= k <= len(s)`.

## Pattern & how to recognise it
- "**Longest substring** under a **budget**" → **dynamic sliding window**.
- The trick is finding the validity condition. To make a window all one letter, keep its most
  frequent letter and change the rest:
  `window_length - max_count <= k`.
- Lesson: [Sliding Window](../../learn/sliding-window/03-recognise.md).

## Learning material
- Keep `counts` for the window (26 letters) and `max_count`, the highest count seen.
- Subtle point: when shrinking, you don't need to *decrease* `max_count`. A stale (too high)
  `max_count` never produces a wrong *longer* answer, because the window only grows when a real
  higher count appears. Explaining this well is a strong interview signal.

## Hints
<details><summary>Hint 1</summary>

For a given window, how many characters do you need to change to make it uniform?
</details>
<details><summary>Hint 2</summary>

The window is valid while `length - (count of its most frequent letter) <= k`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For each `end`: increment `counts[s[end]]` and set `max_count = max(max_count, counts[s[end]])`.
If `end - start + 1 - max_count > k`, decrement `counts[s[start]]` and move `start` right
(a single step is enough). Then record `best = max(best, end - start + 1)`.
Time O(n), space O(26).
</details>

## Follow-ups
- Max Consecutive Ones III (LeetCode 1004): flip at most k zeros. Same window, binary alphabet.
- [Longest Substring Without Repeating Characters](../longest-substring-without-repeating-characters/README.md).
