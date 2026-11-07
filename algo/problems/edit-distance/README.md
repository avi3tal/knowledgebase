# Edit Distance

> Difficulty: **medium** · Patterns: longest-common-substring, dp-2d · Sources: [leetcode](https://leetcode.com/problems/edit-distance/)

## Problem
Given two strings `word1` and `word2`, return the minimum number of operations needed to
convert `word1` into `word2`. Each operation acts on a single character:
- insert a character,
- delete a character,
- replace a character.

## Examples
- `word1 = "horse", word2 = "ros"` → `3`: horse → rorse (replace h) → rose (delete r) → ros (delete e).
- `word1 = "intention", word2 = "execution"` → `5`.
- `word1 = "", word2 = "abc"` → `3`: three insertions.

## Constraints
- `0 <= len(word1), len(word2) <= 500`, lowercase English letters.
- 500 × 500 cells → O(n·m) is the target.

## Pattern & how to recognise it
- **Two strings** and "transform one into the other" at minimum cost → **Longest Common
  Substring** pattern: a 2-D table over prefix pairs `(word1[:i], word2[:j])`.
- Brute force tries every sequence of operations, which is exponential.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/01-intro.md).

## Learning material
- **Prefix-pair DP:** a cell answers the question for the first `i` characters of one string and
  the first `j` of the other, looking only at the last characters and at smaller neighbouring
  cells.
- **Base cases matter:** the cost of turning a prefix into an empty string is not 0.
- Known as the **Levenshtein distance**: [Wikipedia](https://en.wikipedia.org/wiki/Levenshtein_distance).

## Hints
<details><summary>Hint 1</summary>

Look only at the last characters of `word1[:i]` and `word2[:j]`. If they're equal, what does
that cost?
</details>
<details><summary>Hint 2</summary>

If they differ, each of the three operations leaves you with a smaller prefix pair. Which cell
does each one correspond to?
</details>
<details><summary>Hint 3</summary>

Row 0 and column 0: how many operations turn `word1[:i]` into `""`, and `""` into `word2[:j]`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp[i][0] = i`, `dp[0][j] = j`. If `word1[i-1] == word2[j-1]`: `dp[i][j] = dp[i-1][j-1]`,
else `1 + min(dp[i-1][j] (delete), dp[i][j-1] (insert), dp[i-1][j-1] (replace))`. Return
`dp[n][m]`. Two rolling rows bring the space down to O(min(n, m)).

Expected complexity: time O(n·m), space O(min(n, m)).

</details>

## Follow-ups
- Return the actual list of edits (walk back through the full table).
- Only insert and delete are allowed → `n + m − 2·LCS`.
- One Edit Distance (LeetCode 161): decide if the distance is exactly 1, in O(n).
- Different costs per operation (weighted edit distance).
