# Valid Anagram

> Difficulty: **easy** · Patterns: hashmap, arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/valid-anagram/), [neetcode](https://neetcode.io/problems/is-anagram)

## Problem
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` — the same characters
with the same multiplicities, in any order.

## Examples
- `s = "anagram", t = "nagaram"` → `true`
- `s = "rat", t = "car"` → `false`
- `s = "aacc", t = "ccac"` → `false` (same letters, different counts)

## Constraints
- `0 <= len(s), len(t) <= 5 * 10^4`, lowercase English letters (follow-up: Unicode).
- O(n) time; with a fixed alphabet the counter is O(1) space.

## Pattern & how to recognise it
- **"Same multiset of elements"** → **frequency counting**: count `s`, uncount `t`, every count
  must end at zero. Different lengths → `false` immediately.
- Sorting both strings and comparing also works in O(n log n).

## Learning material
- **Counting with a fixed alphabet:** an `[26]int` array indexed by `c - 'a'` beats a hashmap
  (no hashing, no allocation). For Unicode, use a `map[rune]int` and iterate runes, not bytes.
- After the length check, decrementing and failing as soon as a count drops below zero is enough:
  equal lengths + no negative count ⇒ all counts are zero, so a final scan is redundant.
- NeetCode explanation: https://neetcode.io/problems/is-anagram

## Hints
<details><summary>Hint 1</summary>

Two strings are anagrams exactly when every character occurs the same number of times in both.
</details>
<details><summary>Hint 2</summary>

One counter is enough: add for `s`, subtract for `t`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If lengths differ return `false`. `count[26]`; `++` for each char of `s`, `--` for each char of
`t`, returning `false` if a count goes negative. Return `true`.
Time O(n), space O(1) (alphabet-sized).
</details>

## Follow-ups
- Unicode input (runes, map counter).
- Group anagrams (LeetCode 49), find all anagram substrings (LeetCode 438, sliding window).
