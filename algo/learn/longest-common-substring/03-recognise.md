## How to recognise it

**Strong signals:**
- **Two strings or arrays**, and the question is about how they match: common
  substring/subsequence, edit distance, "transform a into b", supersequence, interleaving.
- Or **one sequence** where each element's best answer depends on **earlier** elements that it
  can follow (increasing subsequences, with the best sum, length or count).
- Words like *subsequence*, *edit*, *transform*, *common*, *align*.
- Constraints around n, m ≤ 1000–5000 → an O(n·m) table is expected.

**Which variant?**
- Contiguous (substring/subarray) → cell = run **ending here**. Reset to 0 on a mismatch and
  track the global max.
- Skipping allowed (subsequence) → cell = **best so far**. A mismatch inherits from a
  neighbour, and the answer is the corner cell.
- Costs of operations → min-cost table with non-zero base row and column.

**Anti-signals: it looks similar, but it's a different pattern:**
- **One string**, and the question is about **palindromes** (longest palindromic subsequence,
  min deletions to a palindrome) → **Palindromic Subsequence**. The state is one interval
  `s[i..j]` of a single string, filled by length, not a prefix pair.
- Longest **substring of one string** with a running condition (no repeats, at most k distinct)
  → **Sliding Window**. There's no second string to align against.
- **Merging** two sorted arrays, or intersecting them → **Two Pointers**. You walk both inputs
  once and never need to revisit a prefix pair.
- Choosing items under a **capacity** (subset sum, partition) → **0/1 Knapsack**. The second
  index is a remaining capacity, not a position in another sequence.
- **Return every** common subsequence → **Backtracking**. The output is exponential.

**Complexity:**
- Time O(n·m): one O(1) cell per prefix pair. One-sequence look-back variants: O(n²).
- Space O(n·m) for the table, O(min(n, m)) with rolling rows if you only need the number.

**Common pitfalls:**
- **Index shift:** `dp[i][j]` covers `a[:i]`, so the last characters are `a[i-1]` and
  `b[j-1]`, not `a[i]`.
- Returning the corner cell for a **substring** question. The best run can end anywhere.
- Forgetting the **base row and column** in cost problems: turning `"abc"` into `""` costs 3,
  not 0.
- Rolling-array updates that overwrite `dp[i-1][j-1]` before it's read. Save the diagonal in a
  variable first.
