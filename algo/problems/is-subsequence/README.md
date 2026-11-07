# Is Subsequence

> Difficulty: **easy** · Patterns: strings, two-pointers · Sources: [leetcode](https://leetcode.com/problems/is-subsequence/)

## Problem
Given strings `s` and `t`, return `true` if `s` is a **subsequence** of `t`: you can delete some
(possibly zero) characters of `t`, without reordering the rest, and get `s`.

## Examples
- `s = "abc", t = "ahbgdc"` → `true` (a·h·b·g·d·c).
- `s = "axc", t = "ahbgdc"` → `false`: there is no `x` in `t`.
- `s = "", t = "abc"` → `true`: the empty string is a subsequence of anything.

## Constraints
- `0 <= s.length <= 100`, `0 <= t.length <= 10^4`, lowercase letters.
- One pass over `t`: O(|s| + |t|), O(1) extra space.

## Pattern & how to recognise it
- **Subsequence** (order kept, gaps allowed), one string inside another → a **greedy
  two-pointer scan**: match each character of `s` at its earliest possible position in `t`.
- Taking the earliest match is always safe: it leaves the most of `t` for the rest of `s`.
- Lesson: [Strings](../../learn/strings/01-intro.md).

## Learning material
- **Substring vs subsequence:** a substring is contiguous (`"bgd"` in `"ahbgdc"`); a subsequence
  only keeps the order (`"abc"`). Mixing them up is a classic interview slip.
- Two read pointers, one per string, both only moving forward → linear time.
- [Subsequence (Wikipedia)](https://en.wikipedia.org/wiki/Subsequence)

## Hints
<details><summary>Hint 1</summary>

Walk through `t` once. When should the position in `s` advance?
</details>
<details><summary>Hint 2</summary>

When you're done with `t`, what tells you whether `s` was fully matched?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`i = 0`; for each character `c` of `t`: if `i < len(s)` and `s[i] == c`, `i += 1`. Return
`i == len(s)`.

Expected complexity: time O(|s| + |t|), space O(1).

</details>

## Follow-ups
- Many queries `s1, s2, …, sk` against the same huge `t`: precompute, for every letter, the
  sorted list of its positions in `t`, then binary-search the next position per character.
- Count the subsequences of `t` that equal `s` (DP).
- Longest common subsequence of two strings (DP).
