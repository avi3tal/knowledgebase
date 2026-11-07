## How to recognise it

**Strong signals:**
- A list of items, and for each one a **yes/no choice**: take it or not, put it in group A or B,
  give it a `+` or a `−`.
- **Each item can be used at most once.**
- A **budget or target** that is a small-ish integer: a capacity, a sum, half the total, a
  target value. That number becomes the second dimension of the table.
- The question is **max/min**, **is it possible**, or **how many ways**, not "list them all".
- Brute force would be "try every subset", O(2ⁿ).

**Which variant?**
- Weights and profits → max-profit table.
- Only numbers and a target sum → bool row (subset sum) or count row (count of subsets).
- "Split into two groups" → reduce to one subset with sum `total / 2` (or closest to it).
- "Assign + or − to each number" → count subsets with sum `(total + target) / 2`.

**Anti-signals: it looks similar, but it's a different pattern:**
- Items can be **reused any number of times** (coins, rod pieces, ribbon lengths) →
  **Unbounded Knapsack**. Same table, but the take branch reads the **same row**, and the 1-D
  loop runs **left to right**.
- You must **list every subset** or every valid combination, not count or optimise → **Subsets**
  or **Backtracking**. The output itself is exponential, so a table doesn't help.
- You can take a **fraction** of an item, or the values are "canonical" coins (1, 5, 10, 25) →
  **Greedy** by ratio or by largest first. Greedy fails for 0/1: weights [1, 2, 3], profits
  [6, 10, 12], C = 5 — the best ratio picks 1 and 2 (profit 16), the optimum is 2 and 3 (22).
- The state is "the answer for `i` depends on the last one, two or three answers", with no
  capacity dimension (climbing stairs, house robber) → **Fibonacci Numbers** (1-D DP).
- Two **strings** compared character by character → **Longest Common Substring** /
  **Palindromic Subsequence** style 2-D DP, where the table is indexed by two positions, not
  item × budget.

**Complexity:**
- Brute force O(2ⁿ) time, O(n) stack.
- Memo and table: O(n · C) time and space. One-row version: O(n · C) time, O(C) space.
- Pseudo-polynomial: fine for C up to ~10⁴–10⁵, hopeless for C = 10⁹.

**Common pitfalls:**
- Looping capacity **left to right** in the 1-D version, which turns it into unbounded knapsack.
- Forgetting the base case `dp[0] = True` / `dp[0] = 1` (the empty subset makes sum 0).
- Equal partition: not rejecting an **odd total** before dividing by 2.
- Target sum: forgetting that `(total + target)` must be even and non-negative, or that
  `|target| > total` means 0 ways.
- Counting problems with **zeros**: each zero doubles the count. Don't skip them.
- Off by one between item index `i` in the table (1-based rows) and `weights[i - 1]`.
