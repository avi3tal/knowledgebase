# Palindromic Substrings

> Difficulty: **medium** · Patterns: palindromic-subsequence, dp-2d · Sources: [leetcode](https://leetcode.com/problems/palindromic-substrings/)

## Problem
Given a string `s`, return the number of **substrings** of `s` that are palindromes. A substring
is a contiguous, non-empty run of characters. Substrings at different positions count separately,
even when they contain the same characters.

## Examples
- `s = "abc"` → `3`: `"a"`, `"b"`, `"c"`.
- `s = "aaa"` → `6`: three `"a"`, two `"aa"`, one `"aaa"`.
- `s = "abba"` → `6`: four single letters, `"bb"` and `"abba"`.

## Constraints
- `1 <= len(s) <= 1000`, lowercase English letters.
- n ≤ 1000 means O(n²) is the target. There are O(n²) substrings, so checking each one in O(n)
  (O(n³)) is too slow.

## Pattern & how to recognise it
- "Palindrome" plus "how many substrings" → the **Palindromic Subsequence** family (interval
  DP). Whether `s[i..j]` is a palindrome depends only on its two ends and the inside
  `s[i+1..j-1]`.
- It's a **substring** (contiguous) question, so a cell is a yes/no, not a length.
- Lesson: [Palindromic Subsequence](../../learn/palindromic-subsequence/01-intro.md).

## Learning material
- Interval DP: define a table over intervals `[i, j]` and fill it from short intervals to long
  ones, so every cell can reuse the answer for the interval just inside it.
- A palindrome grows outward: if `s[i+1..j-1]` is a palindrome and `s[i] == s[j]`, then `s[i..j]`
  is one too. Each of the 2n − 1 "centres" (a character, or the gap between two) is the middle
  of a family of nested palindromes.
- [LeetCode 647 editorial discussion](https://leetcode.com/problems/palindromic-substrings/)

## Hints
<details><summary>Hint 1</summary>

If you already know whether `s[i+1..j-1]` is a palindrome, how much work is it to decide
`s[i..j]`?
</details>
<details><summary>Hint 2</summary>

Single characters and equal pairs are the base cases. Fill longer intervals from them and count
every interval that turns out to be a palindrome.
</details>
<details><summary>Hint 3</summary>

Can you avoid the table entirely by starting at a centre and growing outward while the ends
match?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Expand around centres: for each of the 2n − 1 centres (`(i, i)` and `(i, i + 1)`), move `lo`
left and `hi` right while both are in range and `s[lo] == s[hi]`, adding 1 per step. The
table version marks `pal[i][j] = s[i] == s[j] and (j - i < 2 or pal[i+1][j-1])`, filled by
length, and counts the `True` cells.

Expected complexity: time O(n²), space O(1) (O(n²) for the table version).

</details>

## Follow-ups
- Return the longest palindromic substring instead of the count.
- Count palindromic **subsequences** (distinct or not). This is a much harder recurrence.
- Manacher's algorithm counts all palindromic substrings in O(n).
