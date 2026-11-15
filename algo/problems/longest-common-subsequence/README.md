# Longest Common Subsequence

> Difficulty: **medium** · Patterns: longest-common-substring, dp-2d · Sources: [leetcode](https://leetcode.com/problems/longest-common-subsequence/)

## Problem
Given two strings `text1` and `text2`, return the length of their longest common **subsequence**: the
longest string you can get from both by deleting characters (possibly none) without reordering the
rest. Return `0` if they share no character.

## Examples
- `text1 = "abcde"`, `text2 = "ace"` → `3` (`"ace"`).
- `text1 = "abc"`, `text2 = "def"` → `0`.
- `text1 = "facebook"`, `text2 = "kfamlsajjbookjnwooaer"` → `6` (`"fabook"`). The longest common
  **substring** of the same pair is only `"book"` (4): gaps are allowed here.

## Constraints
- `0 <= len(text1), len(text2) <= 1000`, lowercase letters.
- The O(n·m) table is the target. Enumerating subsequences is exponential.

## Pattern & how to recognise it
- **Two sequences + "longest common …"** → the 2-D prefix DP of the Longest Common Substring family.
- The key contrast with [Longest Common Substring](../longest-common-substring/README.md):
  - a **subsequence** may skip characters, so a mismatch **inherits** the best of dropping one
    character, `max(up, left)`, instead of resetting to 0;
  - the answer is the **last cell**, not the table maximum.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/02-variants.md).

## Learning material
- `dp[i][j]` = LCS length of the prefixes `text1[:i]` and `text2[:j]`. It is a property of whole
  prefixes, not of runs that end at `i`, `j`:
  - if `text1[i-1] == text2[j-1]`, then `dp[i][j] = dp[i-1][j-1] + 1`;
  - otherwise `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.
- Rolling two rows gives O(min(n, m)) space. To rebuild the subsequence itself, keep the full table
  and walk back from `dp[n][m]`.
- This table underlies `diff`, Edit Distance and Shortest Common Supersequence.
- Reading: [Wikipedia: Longest common subsequence](https://en.wikipedia.org/wiki/Longest_common_subsequence),
  [LeetCode 1143 editorial](https://leetcode.com/problems/longest-common-subsequence/editorial/).

## Hints
<details><summary>Hint 1</summary>

Look at the last characters of both prefixes. If they are equal, can you always use them?
</details>
<details><summary>Hint 2</summary>

If they differ, at least one of the two can't be in the answer. Which subproblems does that give?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Fill an `(n+1) × (m+1)` table row by row with the recurrence above and return `dp[n][m]`. Keep two
rows, or one row plus a saved diagonal value, for linear space.

Expected complexity: time O(n·m) (O(n^2) for equal lengths), space O(min(n, m)).
</details>

## Follow-ups
- Return the subsequence itself (walk back through the full table).
- [Edit Distance](../edit-distance/README.md): the same prefix table with a cost per operation.
- Shortest Common Supersequence: `n + m - LCS`.
- Minimum deletions to make two strings equal: `n + m - 2·LCS`.
