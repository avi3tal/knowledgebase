## How to recognise it

**Strong signals:**
- The word **palindrome** together with an optimisation or a count: longest, fewest
  deletions or insertions, minimum cuts, how many.
- **One** string (or array), and the answer for a piece depends on **both of its ends**.
- The natural sub-question is "what's the answer for `s[i..j]`?", and it shrinks by peeling off
  `s[i]`, `s[j]` or both.
- Constraints around n ≤ 1000–5000. O(n²) time and space is expected.

**Which table?**
- Subsequence (skipping allowed) → integer `dp[i][j]` with the "drop an end" max.
- Substring (contiguous) → boolean `pal[i][j]`, or expand around centres.
- Splitting into palindromic pieces → boolean table plus a 1-D prefix DP.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Two different strings** compared to each other (common subsequence, edit distance,
  interleaving) → **Longest Common Substring** pattern. The state is `(i in a, j in b)`, a
  prefix pair, not one interval of one string. (The LPS *is* the LCS of `s` and `reverse(s)`,
  but the interval form is the natural one here.)
- **Is this string a palindrome?** or "valid palindrome after removing non-letters" → **Two
  Pointers** from both ends, O(n), no table.
- **Contiguous** window with a running constraint (longest substring with at most k distinct
  characters) → **Sliding Window**. A palindrome can't be maintained incrementally as a window
  slides.
- **List every** palindrome partitioning (not the count or the minimum) → **Backtracking**.
  The output itself is exponential, so no DP table can shortcut it. You may still use the
  boolean table to prune.
- Linked-list palindrome check → **Fast & Slow Pointers** plus in-place reversal.

**Complexity:**
- Time O(n²): n²/2 cells, O(1) each. Partitioning is O(n²) too, with the precomputed table.
- Space O(n²) for the table. O(n) with rolling rows when you only need the number, not the
  palindrome itself.

**Common pitfalls:**
- **Fill order.** Filling row by row top-down reads `dp[i+1][…]` before it exists. Go by
  length, or iterate `i` downwards.
- **Length-2 intervals:** `dp[i+1][j-1]` is then an empty interval (`i+1 > j-1`). It must read
  as 0 (or `True` in the boolean table), not garbage.
- Mixing up **subsequence** and **substring**. The recurrences differ exactly in the
  "ends differ" case.
- Answering `dp[n-1][0]` or `dp[n][n]` instead of `dp[0][n-1]`.
