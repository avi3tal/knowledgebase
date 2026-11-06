# Coin Change (Fewest Coins)

> Difficulty: **medium** · Patterns: dp-1d · Sources: [leetcode](https://leetcode.com/problems/coin-change/), [interactivepython](https://runestone.academy/ns/books/published/pythonds/Recursion/DynamicProgramming.html)

## Problem
Given coin denominations `coins` (unlimited supply of each) and a target `amount`, return the
**fewest** coins that add up to `amount`, or `-1` if it can't be made. `amount = 0` needs 0 coins.

## Examples
- `coins = [1, 2, 5]`, `amount = 11` → `3` (5 + 5 + 1)
- `coins = [2]`, `amount = 3` → `-1`
- `coins = [1, 3, 4]`, `amount = 6` → `2` (3 + 3). Greedy would take 4 + 1 + 1 = 3 coins.

## Constraints
- `1 <= len(coins) <= 12`, `1 <= coins[i] <= 2^31 - 1`, `0 <= amount <= 10^4`.
- Plain recursion over choices is exponential. DP over amounts is O(amount · k), where k = number of
  coins. In the benchmark k is fixed (US coins) and `n = amount`, so the target is O(n).

## Pattern & how to recognise it
- **"Minimum number of items to reach a total", items reusable** → unbounded-knapsack-style 1-D DP
  over the amount.
- **Greedy (take the largest coin) is wrong** for arbitrary denominations: it works for US coins,
  but fails for `[1, 3, 4]` → 6. That counterexample is the signal you need DP.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- `dp[a]` = fewest coins for amount `a`. `dp[0] = 0`, and
  `dp[a] = 1 + min(dp[a - c] for c in coins if c <= a)`, or ∞ if none is reachable. The answer is
  `dp[amount]`, with ∞ mapped to -1.
- **Bottom-up** fills `a = 1..amount` in a loop: O(amount · k) time, O(amount) space, no recursion
  limit.
- **Top-down memoization** gives the same complexity, but the recursion depth can reach `amount`
  (with coin 1). Be careful to memoize "impossible" results too (use a sentinel distinct from
  "not computed yet"). Otherwise they're recomputed exponentially.
- The interactivepython chapter walks from the exponential recursion to memoization to the table.

## Hints
<details><summary>Hint 1</summary>

Suppose the last coin you use is `c`. What subproblem remains?
</details>
<details><summary>Hint 2</summary>

Fill a table for every amount from 0 up. Use ∞ for "unreachable" so `min` and `+1` still work.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp = [0] + [inf] * amount`. For each `a` in `1..amount` and each coin `c <= a`, set
`dp[a] = min(dp[a], dp[a - c] + 1)`. Return `dp[amount]`, or -1 if it is inf.
Time O(amount · k), space O(amount).
</details>

## Follow-ups
- Count the number of combinations (Coin Change II, LeetCode 518): the loop order matters (coins outer).
- Return the actual coins used: keep a `parent[a]` pointer.
- Limited supply of each coin → bounded knapsack.
