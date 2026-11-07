# Palindrome Partitioning II (Minimum Cuts)

> Difficulty: **hard** · Patterns: palindromic-subsequence, dp-2d · Sources: [leetcode](https://leetcode.com/problems/palindrome-partitioning-ii/)

## Problem
Given a string `s`, cut it into pieces so that **every piece is a palindrome**. Return the
**minimum number of cuts** needed. A string that is already a palindrome needs 0 cuts.

## Examples
- `s = "aab"` → `1`: `"aa" | "b"`.
- `s = "a"` → `0`.
- `s = "aaabaa"` → `1`: `"a" | "aabaa"`. Taking the longest palindromic prefix first
  (`"aaa"`) leads to 2 cuts, so a greedy choice is wrong.

## Constraints
- `1 <= len(s) <= 2000`, lowercase English letters.
- n ≤ 2000 means O(n²). Trying every set of cut positions (2ⁿ⁻¹) is hopeless, and an O(n³)
  solution is borderline.

## Pattern & how to recognise it
- "Palindrome" plus "minimum" → the **Palindromic Subsequence** family. The repeated question
  "is `s[i..j]` a palindrome?" is an interval DP table.
- On top of that sits a second, 1-D DP over prefixes: the best way to cut `s[0..j]`.
- Compare with "return **all** palindrome partitionings", which is backtracking because the
  output is exponential. Here only the minimum is asked, so DP applies.
- Lesson: [Palindromic Subsequence](../../learn/palindromic-subsequence/01-intro.md).

## Learning material
- **Interval DP** (boolean): `pal[i][j]` tells whether `s[i..j]` is a palindrome. It depends on
  `s[i] == s[j]` and on `pal[i+1][j-1]`, so fill it from short intervals to long ones. That's
  O(n²) cells, O(1) each.
- **Prefix DP**: the last piece of an optimal cut of `s[0..j]` is some palindrome `s[i..j]`.
  Everything before it is an optimal cut of `s[0..i-1]`.
- [Palindrome Partitioning II (LeetCode 132)](https://leetcode.com/problems/palindrome-partitioning-ii/)

## Hints
<details><summary>Hint 1</summary>

Fix the **last** piece of the partition. What do you need to know about everything before it?
</details>
<details><summary>Hint 2</summary>

You'll ask "is `s[i..j]` a palindrome?" O(n²) times. Answer all of those questions up front in
a table so each costs O(1).
</details>
<details><summary>Hint 3</summary>

`cuts[j]` = the fewest cuts for `s[0..j]`. If `s[0..j]` is a palindrome, it's 0. Otherwise try
every `i` with `s[i..j]` a palindrome.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Build `pal[i][j]` (interval DP: `s[i] == s[j] and (j - i < 2 or pal[i+1][j-1])`). Then for each
`j`: `cuts[j] = 0` if `pal[0][j]`, else `min(cuts[i-1] + 1 for i in 1..j if pal[i][j])`. Return
`cuts[n-1]`. The two loops can be merged by expanding around centres, which brings the extra
space down to O(n).

Expected complexity: time O(n²), space O(n²) (O(n) with centre expansion).

</details>

## Follow-ups
- Return the partition itself, not only the number of cuts.
- Palindrome Partitioning (LeetCode 131): list every partition (backtracking).
- Palindrome Partitioning III: change at most k characters and split into exactly k pieces.
