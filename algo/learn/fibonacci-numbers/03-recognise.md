## How to recognise it

**Strong signals:**
- The input is a **line**: stairs, houses in a row, days, positions in an array, or just a number
  `n`.
- At each position you make a **small local choice** (step 1, 2 or 3; rob or skip; which jump),
  and the choice only reaches back a **fixed few positions**.
- You can write `f(i)` using `f(i−1)`, `f(i−2)`, … and **no other index** (no capacity, no second
  string).
- The question is "how many ways", "minimum cost" or "maximum value" to reach position `n`.
- The naive recursion recomputes the same `f(i)` many times.

**Anti-signals: it looks similar, but it's a different pattern:**
- There's a **budget dimension** (capacity, target sum) next to the position, and items can be
  used **at most once** → **0/1 Knapsack**. The state is `(i, capacity)`, a 2-D table.
- Items are reusable and you count **combinations** (order doesn't matter) → **Unbounded
  Knapsack**, with the items in the outer loop. If **order matters**, it's back to this pattern.
- Two strings or a substring `[i..j]` → **Longest Common Substring** or **Palindromic
  Subsequence** (2-D DP over two indices).
- A local choice that is provably always right, so no look-back is needed ("can you reach the
  end?") → **Greedy**.
- You must **list** every way, not count it → **Backtracking**.

**Complexity:**
- Brute-force recursion: O(kⁿ) for k choices per step (O(φⁿ) for Fibonacci).
- Memo or array: O(n · k) time, O(n) space. Rolling variables: O(1) space.

**Common pitfalls:**
- Wrong base cases: `ways(0) = 1` (one way to do nothing), not 0. Negative indices are 0 ways.
- Off by one on "the top": in min-cost stairs, the top is position `n`, just past the last stair.
- Updating the rolling variables in the wrong order. Use tuple assignment (`a, b = b, a + b`) or
  a temporary.
- Deep recursion with a memo for large `n`. Switch to bottom-up.
- Overflow in Go/Java for counts. Fibonacci passes 2⁶³ around n = 92, so problems often ask for
  the answer modulo 10⁹ + 7.
