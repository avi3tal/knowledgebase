# Longest Common Prefix

> Difficulty: **easy** · Patterns: arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/longest-common-prefix/), [interviewbit](https://www.interviewbit.com/problems/longest-common-prefix/)

## Problem
Given an array of strings `strs`, return the longest string that is a prefix of **every** string
in the array. Return `""` if there is none.

## Examples
- `["flower","flow","flight"]` → `"fl"`.
- `["dog","racecar","car"]` → `""`.
- `["alone"]` → `"alone"`.

## Constraints
- `1 <= len(strs) <= 200`, `0 <= len(strs[i]) <= 200`, lowercase letters.
- Let `S` be the total number of characters. Any correct method may need to read up to `S`
  characters (all strings equal), so **O(S)** time is optimal. The extra space can be O(1)
  besides the answer.

## Pattern & how to recognise it
- **"Common prefix of many strings"** → **scanning**:
  - *Horizontal:* `prefix = strs[0]`, then shrink it against each next string.
  - *Vertical:* for column `c = 0, 1, …`, check that every string has the same character at `c`.
    Stop at the first mismatch or at the end of the shortest string. This stops as early as
    possible.
- Sorting and comparing only the first and last strings also works (O(S log n)). A **trie** pays
  off when you have many queries.

## Learning material
- **Vertical scanning** reads at most `n · L_min` characters, where `L_min` is the shortest
  length. When the strings share almost nothing, it beats horizontal scanning.
- **Bound your index:** the scan length is the length of the *shortest* string. Careful:
  `min(a, b)` on strings is **lexicographic** (`min("b", "ab") == "ab"`); you want
  `min(len(a), len(b))`.
- **Building strings:** `s += c` in a loop is O(L^2) in the worst case in many languages.
  Prefer slicing the final index once (`strs[0][:i]`).
- Reference: https://leetcode.com/problems/longest-common-prefix/editorial/

## Hints
<details><summary>Hint 1</summary>

The answer is a prefix of `strs[0]`. You only need to find its length.
</details>
<details><summary>Hint 2</summary>

Check column by column: does every string have the same character at position `i`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Vertical scan: for `i` in `range(len(strs[0]))`, take `c = strs[0][i]`. For each other string
`s`, if `i == len(s)` or `s[i] != c`, return `strs[0][:i]`. If the loop finishes, return
`strs[0]`. Time O(S), space O(1) besides the output.
</details>

## Follow-ups
- Many queries against a fixed set: build a **trie** and walk down while a node has exactly one
  child and isn't the end of a word.
- The longest common **substring** of two strings (DP or suffix automaton). It's a very
  different problem.
- Divide and conquer: LCP(left half) and LCP(right half), then merge.
