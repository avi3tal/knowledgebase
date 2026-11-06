# Longest Substring Without Repeating Characters

> Difficulty: **medium** · Patterns: sliding-window · Sources: [leetcode](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

## Problem
Given a string `s`, return the length of the longest **substring** (contiguous) that contains
no repeated characters.

## Examples
- `"abcabcbb"` → `3` (`"abc"`)
- `"bbbbb"` → `1`
- `"pwwkew"` → `3` (`"wke"`; `"pwke"` is a subsequence, not a substring)

## Constraints
- `0 <= len(s) <= 5·10^4`. `s` may contain letters, digits, symbols and spaces.

## Pattern & how to recognise it
- "**Longest substring** with a property you can maintain incrementally" (all characters
  distinct) → **dynamic sliding window**: grow on the right, shrink from the left until the new
  character is unique again.
- Lesson: [Sliding Window](../../learn/sliding-window/02-dynamic.md). This problem is the k-distinct
  example's cousin: here the condition is "no count above 1".

## Learning material
- Window state: a set (or char → count map) of the characters in the window.
- Optimisation: store `char → last index` and **jump** `start` to `last[c] + 1`, never moving
  it backwards. That's still O(n), with fewer steps.
- Watch `"abba"`: when you meet the second `a`, its last index is *before* `start`, so a jump
  must use `max(start, last[c] + 1)`.

## Hints
<details><summary>Hint 1</summary>

When you add a character that's already in the window, which part of the window must go?
</details>
<details><summary>Hint 2</summary>

Remembering where you last saw each character lets you move `start` in one jump.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`last = {}`, `start = 0`. For each `end, c`: if `c in last and last[c] >= start`, set
`start = last[c] + 1`. Then `last[c] = end` and `best = max(best, end - start + 1)`.
Time O(n), space O(min(n, alphabet)).
</details>

## Follow-ups
- At most k distinct characters (the lesson's dynamic example), or at most 2 (Fruit Into
  Baskets).
- [Longest Repeating Character Replacement](../longest-repeating-character-replacement/README.md).
