# Minimum Insertions to Make a String Palindrome

> Difficulty: **hard** · Patterns: dp-2d, palindromic-subsequence · Sources: [leetcode](https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/), interviewbit

## Problem
Given a string `s`, you may insert any character at **any position**. Return the minimum number
of insertions needed to make `s` a palindrome.

## Examples
- `"zzazz"` → `0`, because it's already a palindrome.
- `"mbadm"` → `2`, e.g. `"mbdadbm"` or `"mdbabdm"`.
- `"leetcode"` → `5`, e.g. `"leetcodocteel"`.

## Constraints
- `1 <= len(s) <= 500`, lowercase letters.
- Plain recursion is exponential, and `n = 500` rules it out. The target is the **O(n^2)** interval
  DP.

## Pattern & how to recognise it
- **"Min operations to make a string a palindrome"** → an **interval DP** on `s[i..j]`:
  - if `s[i] == s[j]`, then `f(i, j) = f(i+1, j-1)`;
  - otherwise `f(i, j) = 1 + min(f(i+1, j), f(i, j-1))`. Insert a copy of one end on the
    other side.
- The recursion revisits the same `(i, j)` pairs exponentially often (**overlapping
  subproblems**). There are only O(n^2) distinct pairs, so memoize or build a table.
- Equivalent view: answer = `n - LPS(s)`, where LPS is the longest palindromic **subsequence**,
  which equals the LCS of `s` and `reverse(s)`.

## Learning material
- **Interval DP:** the state is a substring `[i, j]`, so fill the table by increasing length
  (or by `i` descending and `j` ascending). Base cases: `i >= j` gives 0.
- **Memoization vs tabulation:** `@functools.lru_cache` on the recursion gives O(n^2) time and
  space, plus O(n) recursion depth. A table `dp[i][j]` avoids recursion limits. You can keep just
  one row to get O(n) space.
- **Why naive recursion is exponential:** with all-distinct characters, every call branches in
  two, and each branch shrinks the length by only 1. That's about 2^n calls for n characters.
- Reference: https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/editorial/

## Hints
<details><summary>Hint 1</summary>

Look at the two ends of the string. If they're equal, what's left to solve? If not, what are
your two options?
</details>
<details><summary>Hint 2</summary>

How many different `(i, j)` subproblems exist? Store each answer once.
</details>
<details><summary>Hint 3</summary>

The characters that *don't* need an inserted partner form a palindromic subsequence.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp[i][j]` = the minimum insertions for `s[i..j]`. Iterate `i` from `n-1` down to `0` and `j`
from `i+1` to `n-1`. If `s[i] == s[j]`, then `dp[i][j] = dp[i+1][j-1]`; otherwise
`dp[i][j] = 1 + min(dp[i+1][j], dp[i][j-1])`. Return `dp[0][n-1]`.
Time O(n^2), space O(n^2) (O(n) with a rolling row).
</details>

## Follow-ups
- **Insert only at the front** (InterviewBit "Minimum Characters required to make a String
  Palindromic"): the answer is `n - (length of the longest palindromic prefix)`. KMP on
  `s + "#" + reverse(s)` finds it in O(n).
- Minimum **deletions** to make a palindrome: the same number, by the same argument.
- Longest Palindromic Subsequence (LeetCode 516).
- Valid Palindrome III (LeetCode 1216): can you do it with at most `k` deletions?
