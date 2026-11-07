# Coin Change II (Number of Ways)

> Difficulty: **medium** · Patterns: unbounded-knapsack · Sources: [leetcode](https://leetcode.com/problems/coin-change-ii/)

## Problem
Given an integer `amount` and an array of distinct coin denominations `coins`, with an
**unlimited supply** of each coin, return the **number of combinations** that make up `amount`.
Order doesn't matter: `1 + 2` and `2 + 1` are the same combination. If the amount can't be made,
return 0. `amount = 0` has exactly one combination (no coins).

## Examples
- `amount = 5`, `coins = [1, 2, 5]` → `4`: 5, 2+2+1, 2+1+1+1, 1+1+1+1+1.
- `amount = 3`, `coins = [2]` → `0`.
- `amount = 10`, `coins = [10]` → `1`.

## Constraints
- `1 <= len(coins) <= 300`, `1 <= coins[i] <= 5000`, all distinct, `0 <= amount <= 5000`.
- The answer fits in a signed 32-bit integer.
- In the benchmark the coins are fixed (`[1, 5, 10, 25]`) and `n = amount`, so the target is
  O(n).

## Pattern & how to recognise it
- **Reusable items** (unlimited coins), a **budget** (the amount) and a **count** of ways →
  **unbounded knapsack**, counting version.
- The subtle part is **combinations vs permutations**. Putting the **coins in the outer loop**
  counts each multiset once. Putting the amounts in the outer loop counts every order
  separately (that's Combination Sum IV, a Fibonacci-style recurrence).
- Lesson: [Unbounded Knapsack](../../learn/unbounded-knapsack/01-intro.md).

## Learning material
- `dp[a]` = number of ways to make `a` with the coins processed so far. `dp[0] = 1`.
- For each coin `c`, for `a` from `c` **up** to `amount`: `dp[a] += dp[a - c]`. Walking left to
  right lets `dp[a - c]` already include coin `c`, which is what "unlimited supply" means.
- O(k · amount) time, O(amount) space, where k = number of coins.
- Contrast: [Coin Change](../coin-change/README.md) asks for the **fewest** coins (min instead of +).

## Hints
<details><summary>Hint 1</summary>

Brute force: for the first coin, decide how many of it to use, then recurse on the rest. What
are the states?
</details>
<details><summary>Hint 2</summary>

If you loop over amounts outside and coins inside, you'll count 1+2 and 2+1 separately. Swap the
loops.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp = [1] + [0] * amount`. For each coin `c`, for `a` in `c..amount`: `dp[a] += dp[a - c]`.
Return `dp[amount]`.

Expected complexity: time O(k · amount), space O(amount).

</details>

## Follow-ups
- Count ordered sequences instead (Combination Sum IV, LeetCode 377).
- Each coin may be used at most once (that's Count of Subset Sum, 0/1 knapsack).
- Fewest coins (Coin Change, LeetCode 322).
