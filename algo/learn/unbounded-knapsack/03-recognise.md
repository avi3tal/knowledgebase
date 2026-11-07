## How to recognise it

**Strong signals:**
- A set of item **types**, each available in **unlimited supply**: coin denominations, piece
  lengths, allowed step sizes, perfect squares.
- A **budget** that is a small-ish integer: an amount, a rod or ribbon length, `n`.
- The question is **max value**, **fewest items**, **most items** or **number of ways**.
- Words like "any number of times", "unlimited", "infinite supply", "you may reuse".

**Which variant?**
- Value per piece → max (rod cutting). Fewest pieces → min with ∞ for impossible (coin change).
- Must fill **exactly** → initialise unreachable cells to ±∞ and return −1 if still unreachable.
- "Number of ways" where **order doesn't matter** → items in the outer loop (coin change II).

**Anti-signals: it looks similar, but it's a different pattern:**
- Each item can be used **at most once** → **0/1 Knapsack**. The take branch reads the row
  above, and the 1-D loop runs **right to left**. Check this first: it's the most common mix-up.
- "Number of ways" where **order matters** (1 + 3 and 3 + 1 are different), or the budget only
  shrinks by a fixed set of steps → **Fibonacci Numbers**: `f(n) = f(n − a) + f(n − b) + …`
  with the budget as the only loop.
- The coins are **canonical** (1, 5, 10, 25) and you only need the fewest → **Greedy** happens to
  work. For arbitrary denominations it doesn't: coins [1, 3, 4], amount 6 → greedy 4 + 1 + 1,
  optimal 3 + 3.
- You must **list** every combination → **Backtracking** (Combination Sum). Tables count; they
  don't enumerate.

**Complexity:**
- Brute force: exponential.
- Memo / table: O(k · T) time and space, k = item types, T = budget. One row: O(T) space.
- Pseudo-polynomial again: T must be small.

**Common pitfalls:**
- Writing the 0/1 loop (right to left) and wondering why items aren't reused, or the reverse.
- Swapping the loops in "count the ways" and counting permutations instead of combinations.
- Using 0 as the default in an exact-fill problem, so impossible amounts look possible.
- `min` with `float("inf")` in Go or Java: use a large sentinel and guard the `+ 1`.
- Forgetting `dp[0] = 1` for counting (one way to make 0: take nothing).
