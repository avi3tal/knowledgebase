# Longest Common Substring (Return the String)

> Difficulty: **medium** · Patterns: longest-common-substring, dp-2d · Sources: interview:meta

## Problem
You are given two strings, `s1` (any length) and `s2` (**exactly 21 characters**). Return the
longest substring of `s2` that also appears as a **contiguous** substring of `s1` and has **at least
2 characters**. If no such substring exists, return `""`.

When several substrings share the maximum length, return the one that **starts earliest in `s2`**.

## Examples
- `s1 = "facebook"`, `s2 = "kfamlsajjbookjnwooaer"` → `"book"`. `"fa"`, `"bo"`, `"oo"`, `"ok"` and
  `"boo"` also occur in both, but `"book"` is the longest.
- `s1 = "abc"`, `s2 = "cxbxaxcxbxaxcxbxaxcxb"` → `""`. Every letter of `s1` appears in `s2`, but no two
  adjacent letters of `s2` appear next to each other in `s1`. Single characters don't count.
- `s1 = "abxycd"`, `s2 = "cdzzzzzzzzzzzzzzzzzab"` → `"cd"`. Both `"cd"` and `"ab"` have length 2;
  `"cd"` starts earlier in `s2`.

## Constraints
- `len(s2) == 21`; `0 <= len(s1) <= 10^5`; lowercase letters.
- `s2` is tiny and **fixed**, so anything polynomial in `len(s2)` is a constant. The target is linear
  in `len(s1)`. The O(n·m) table of the general problem is fine here, because `m = 21`.

## Pattern & how to recognise it
- **Two strings + "longest common contiguous piece"** → Longest Common Substring, a 2-D DP over
  `(i, j)` = "the common run that ends at `s1[i]` and `s2[j]`".
- It differs from the [base problem](../longest-common-substring/README.md) in three ways:
  - it returns the **string** (keep the end index of the best run, not only its length);
  - it has a **minimum length** of 2;
  - it has a **tie-break** rule.
- **Read the constraint.** "`s2` is 21 chars" is the interviewer's hint. With one side constant, two
  more approaches become linear and are worth naming:
  - enumerate the 210 substrings of `s2` of length ≥ 2, longest first, and test each with `in s1`;
  - index every substring of `s1` up to length 21 in a set (≈ 21·n entries).

  Say which you pick and why (memory, early exit, simplicity).
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/01-intro.md).

## Learning material
- Define `dp[i][j]` = length of the common substring that **ends exactly** at `s1[i-1]` and
  `s2[j-1]`. If the characters match, `dp[i][j] = dp[i-1][j-1] + 1`; otherwise it is `0`, because a
  mismatch breaks contiguity.
- The answer is the **maximum anywhere in the table**, not the last cell. To return the string,
  remember where the best run ends (`j`) and slice `s2[j - best : j]`.
- Each row only reads the previous row. Keeping one row of `len(s2) + 1` cells gives O(1) extra space
  here, since `len(s2)` is fixed.
- **Tie-break care:** update the best only on a strictly longer run. Then "earliest in `s2`" has to
  come from how you scan, or from comparing start positions on equal lengths. Check that your loop
  order really gives the earliest one.
- Reading: [GeeksforGeeks: Longest Common Substring](https://www.geeksforgeeks.org/longest-common-substring-dp-29/),
  [Wikipedia: Longest common substring](https://en.wikipedia.org/wiki/Longest_common_substring).

## Hints
<details><summary>Hint 1</summary>

What is the longest common substring that *ends* at `s1[i]` and `s2[j]`? How does it relate to the
one ending at `s1[i-1]` and `s2[j-1]`?
</details>
<details><summary>Hint 2</summary>

`s2` has only 21 characters. How many substrings of length ≥ 2 does it have? What would checking
each of them against `s1` cost?
</details>
<details><summary>Hint 3</summary>

Whichever approach you choose, handle three edge cases: a length-1 match must not count, `s1` may be
shorter than 2, and ties must be resolved by start position in `s2`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

DP with a rolling row over `s2`. Keep `row = [0] * 22`. For each character `c` of `s1`, walk `j` from
21 down to 1:
- if `c == s2[j-1]`, set `row[j] = row[j-1] + 1`;
- otherwise set `row[j] = 0`.

Going right to left lets `row[j-1]` still hold the previous row's value. Track the best run as
`(length, start = j - length)`. Replace it when the length is longer, or equal with a smaller start.
At the end, return `s2[start : start + length]` if `length >= 2`, else `""`.

Alternative: for `L` from 21 down to 2, and each start `i` from left to right, test whether
`s2[i:i+L]` is in `s1`. Return the first hit; the scan order gives the tie-break for free.

Expected complexity: time O(n), i.e. O(21·n), space O(1) extra (n = `len(s1)`).
</details>

## Follow-ups
- Return **all** longest common substrings, or count them.
- Drop the 21-char limit: both strings up to 10^5. Then use binary search on the length with a
  rolling hash, or a suffix automaton (see [Longest Duplicate Substring](../longest-duplicate-substring/README.md)).
- The same question on integer arrays: [Maximum Length of Repeated Subarray](../maximum-length-of-repeated-subarray/README.md).
- Subsequence instead of substring: [Longest Common Subsequence](../longest-common-subsequence/README.md).
