# How to recognise it

**Strong signals:**
- The question asks for a **count** ("how many ways"), an **optimum** ("min cost", "max
  profit", "longest", "fewest"), or **feasibility** ("can you reach / make / split").
- The choices are **sequential**: at each step you pick one of a few options, and the
  consequences are summarised by a small state (index, remaining amount, last item used).
- A brute-force recursion is easy to write but **exponential**, and you can see it repeat the same
  arguments.
- The constraints fit a table: n ≤ a few thousand (O(n²)), or two strings ≤ 1000 each (O(n·m)).

**Which DP family? (each has its own lesson)**
- Each value depends on the **previous one to three values** (stairs, houses in a row) →
  **Fibonacci Numbers** (1-D).
- Pick items **at most once** under a capacity / target sum → **0/1 Knapsack**.
- Items can be **reused** (coins, rod pieces) → **Unbounded Knapsack**.
- Two sequences compared position by position (common subsequence, edit operations) → **Longest
  Common Substring** (2-D over two indices).
- Palindromes, or a range `i..j` shrinking from both ends → **Palindromic Subsequence**
  (interval DP).
- A grid with right/down moves, or "the largest square / rectangle ending here" → grid DP
  (this lesson).

**Anti-signals: it looks similar, but it's a different pattern:**
- You must **list every** solution, not count them or find the best one → **Backtracking** /
  **Subsets**. The output itself is exponential, so a table can't help.
- A provably safe **local choice** exists (earliest finish first, take the largest that fits
  with canonical coins) → **Greedy**, O(n log n) or better. Check it with a counterexample
  before you trust it.
- **Shortest path** in an unweighted grid or graph with arbitrary moves (cycles possible) →
  **BFS**. DP needs an order with no cycles between states.
- A **contiguous** window with a monotone condition → **Sliding Window**.

**Complexity:**
- Time = number of states × transitions per state. Space = number of states (or one row
  after optimising).

**Common pitfalls:**
- A state that **doesn't capture enough** (the answer depends on something you didn't store).
  Add a dimension, e.g. "last item used" or "holding / not holding".
- Wrong **base cases**: the empty prefix, amount 0, the first row / column. Write down what
  `dp[0]` *means* first.
- Filling in the wrong **order**, so you read a cell before it's computed.
- Off-by-one between "first i items" (table size n + 1) and "item i" (size n).
- Initialising a min-DP with 0 instead of infinity, or forgetting to treat "unreachable" as a
  separate value.
