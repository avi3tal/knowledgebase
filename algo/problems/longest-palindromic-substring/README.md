# Longest Palindromic Substring

> Difficulty: **medium** · Patterns: dp-2d, two-pointers · Sources: [leetcode](https://leetcode.com/problems/longest-palindromic-substring/), [geeksforgeeks](https://www.geeksforgeeks.org/longest-palindrome-substring-set-1/), [interviewbit](https://www.youtube.com/watch?v=UflHuQj6MVA)

## Problem
Given a string `s`, return the longest contiguous substring of `s` that reads the same forwards and
backwards. If several have the maximum length, any of them is accepted.

## Examples
- `"babad"` → `"bab"` (`"aba"` is also correct)
- `"cbbd"` → `"bb"` (an even-length palindrome: there is no single middle character)
- `"racecar"` → `"racecar"` (the whole string)

## Constraints
- `1 <= len(s) <= 1000`, letters and digits.
- Checking all O(n²) substrings in O(n) each is O(n³), too slow at n = 1000. Aim for O(n²) time.

## Pattern & how to recognise it
- **"Longest palindromic …"**: a palindrome is defined from the inside out (`s[i..j]` is a
  palindrome iff `s[i] == s[j]` and `s[i+1..j-1]` is one). That is an interval DP over `(i, j)`, or
  the same idea without a table: **expand around each center** with two pointers.
- There are `2n - 1` centers: n single characters (odd lengths) and n-1 gaps (even lengths).
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- **Interval DP:** `dp[i][j] = (s[i] == s[j]) and (j - i < 2 or dp[i+1][j-1])`. Fill by increasing
  length so the inner interval is ready. Lengths go from 1 **up to and including n**. This is O(n²)
  time and O(n²) space.
- **Expand around center:** for each center, grow `l--, r++` while `s[l] == s[r]`. This is O(n²) time
  in the worst case (`"aaaa…"`) and O(1) space, and is usually the interview answer.
- **Manacher's algorithm** reuses mirror information to get O(n). Know that it exists. You are rarely
  asked to code it.
- Video (DP walkthrough): https://www.youtube.com/watch?v=UflHuQj6MVA

## Hints
<details><summary>Hint 1</summary>

If you know whether `s[i+1..j-1]` is a palindrome, how do you decide `s[i..j]` in O(1)?
</details>
<details><summary>Hint 2</summary>

Every palindrome has a center: either a character or the gap between two equal characters.
Try growing outward from each of the 2n-1 centers.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For each `c` in `0..n-1`, expand around `(c, c)` and `(c, c+1)` while the ends match and stay in
range. Track the best `(start, length)`. Return `s[start:start+length]`. Time O(n²), space O(1).
The table version checks lengths 1, 2, then 3..n with `dp[i][j] = s[i]==s[j] and dp[i+1][j-1]`.
</details>

## Follow-ups
- Count all palindromic substrings (LeetCode 647): the same expansion, counting instead of taking the max.
- Longest palindromic **subsequence** (LeetCode 516): 2-D DP with `max(dp[i+1][j], dp[i][j-1])` on a mismatch.
- [Minimum insertions to make a string a palindrome](../minimum-insertions-to-make-palindrome/README.md).
- Manacher's algorithm for O(n).
- Related: [Longest Common Substring](../longest-common-substring/README.md). The LCS of `s` and
  `reverse(s)` is *not* always a palindrome. Check the indices align.
