# Perfect Squares

> Difficulty: **medium** · Patterns: unbounded-knapsack · Sources: [leetcode](https://leetcode.com/problems/perfect-squares/)

## Problem
Given a positive integer `n`, return the **least number of perfect squares** (1, 4, 9, 16, …)
that add up to `n`. Squares may repeat.

## Examples
- `n = 12` → `3` (4 + 4 + 4).
- `n = 13` → `2` (4 + 9).
- `n = 18` → `2` (9 + 9). Greedy takes 16 + 1 + 1 = 3.

## Constraints
- `1 <= n <= 10^4`.
- There are about √n squares up to `n`, so the table approach is O(n · √n).

## Pattern & how to recognise it
- The "coins" are the squares `1, 4, 9, …`, each usable **any number of times**, and you want
  the **fewest** items that make exactly `n` → **unbounded knapsack**, minimum version. It's
  Coin Change with generated coins.
- Greedy (largest square first) fails: 18 → 16 + 1 + 1 instead of 9 + 9.
- Lesson: [Unbounded Knapsack](../../learn/unbounded-knapsack/02-variants.md).

## Learning material
- `dp[t]` = fewest squares summing to `t`. `dp[0] = 0`,
  `dp[t] = 1 + min(dp[t - s*s] for s*s <= t)`.
- Every `t` is reachable (1 is a square), so no "impossible" marker is needed.
- Alternative: BFS over remainders, where each level subtracts one square.
- Math fact (Lagrange): the answer is never more than 4.

## Hints
<details><summary>Hint 1</summary>

Which "coins" are you allowed to use? How many of them are at most `n`?
</details>
<details><summary>Hint 2</summary>

Solve for every value from 1 to `n`, re-using smaller answers.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp = [0] + [inf] * n`. For `t` in `1..n`, for each square `q <= t`: `dp[t] = min(dp[t], dp[t - q] + 1)`.
Return `dp[n]`.

Expected complexity: time O(n · √n), space O(n).

</details>

## Follow-ups
- Return the squares themselves.
- O(√n) solution using Legendre's three-square theorem.
