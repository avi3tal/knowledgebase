# Longest Common Substring

> Difficulty: **medium** · Patterns: dp-2d · Sources: [wikibooks](https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Longest_common_substring#Python), interviewbit

## Problem
Given two strings `s1` and `s2`, return the **length** of the longest string that appears as a
**contiguous** substring of both. Return `0` if they share no character.

## Examples
- `s1 = "GeeksforGeeks"`, `s2 = "GeeksQuiz"` → `5` (`"Geeks"`)
- `s1 = "abcdxyz"`, `s2 = "xyzabcd"` → `4` (`"abcd"`; `"xyz"` is only 3)
- `s1 = "ab"`, `s2 = "ba"` → `1`. `"ab"` is not a substring of `"ba"`. Order and contiguity both matter.

## Constraints
- `0 <= len(s1), len(s2) <= 1000`, lowercase/uppercase letters.
- About 10^6 cell pairs, so an O(n·m) table is fine. Enumerating all O(n²) substrings of one string
  and searching each in the other (O(n²·m) or worse) is not.

## Pattern & how to recognise it
- **Two sequences + "longest common …"** → a 2-D DP table indexed by prefixes `(i, j)`.
- The key difference from Longest Common **Subsequence**: a substring must be contiguous, so a
  mismatch **resets** the run to 0 instead of inheriting `max(left, up)`. The answer is the max over
  the whole table, not the bottom-right cell.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- Define `dp[i][j]` = length of the longest common substring that **ends exactly** at `s1[i-1]` and
  `s2[j-1]`. Then `dp[i][j] = dp[i-1][j-1] + 1` if the characters match, else `0`.
- Use one extra row and column of zeros (`dp[0][*] = dp[*][0] = 0`) so `i-1` / `j-1` never index
  outside the strings. Python's negative indices make an off-by-one here silently wrong, not a crash.
- Each cell only reads the previous row, so two rows (or one row updated right-to-left) give
  O(min(n, m)) space.
- Alternatives for long strings: binary search on the length + rolling hash (O((n+m) log n)) or a
  suffix automaton / generalized suffix tree (linear).
- Reading: https://www.geeksforgeeks.org/longest-common-substring-dp-29/

## Hints
<details><summary>Hint 1</summary>

What is the longest common substring that *ends* at position `i` of `s1` and position `j` of `s2`?
</details>
<details><summary>Hint 2</summary>

If `s1[i] != s2[j]` that value is 0. Otherwise it extends the diagonal neighbour by one.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Allocate `(n+1) x (m+1)` zeros. For `i in 1..n`, `j in 1..m`: if `s1[i-1] == s2[j-1]`, set
`dp[i][j] = dp[i-1][j-1] + 1` and update the best. Otherwise leave it 0. Return the best. To get the
substring itself, remember the end index `i` of the best and slice `s1[i-best:i]`.
Time O(n·m) (O(n²) in the benchmark, which uses equal lengths), space O(min(n, m)) with rolling rows.
</details>

## Follow-ups
- Return the substring itself, or all longest ones.
- Longest Common **Subsequence** (LeetCode 1143): the same table, but on a mismatch take `max(up, left)`.
- Maximum Length of Repeated Subarray (LeetCode 718): the same problem on integer arrays.
- Longest substring common to k strings (suffix automaton / binary search + hashing).
- Related: [Longest Palindromic Substring](../longest-palindromic-substring/README.md).
