# Count of Subset Sum

> Difficulty: **medium** · Patterns: knapsack-0-1 · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/problems/perfect-sum-problem5633/1)

## Problem
Given an array of non-negative integers `nums` and an integer `target`, return the **number of
subsets** (by position, each element used at most once) whose sum is exactly `target`. Return
the count **modulo 10⁹ + 7**. The empty subset counts and sums to 0.

## Examples
- `nums = [1, 1, 2, 3]`, `target = 4` → `3`: {1, 3} (first 1), {1, 3} (second 1), {1, 1, 2}.
- `nums = [1, 2, 7, 1, 5]`, `target = 9` → `3`: {2, 7}, {1, 7, 1}, {1, 2, 1, 5}.
- `nums = [0, 0, 1]`, `target = 1` → `4`: {1} with or without each zero.

## Constraints
- `1 <= len(nums) <= 1000`, `0 <= nums[i] <= 1000`, `0 <= target <= 1000`.
- Counting by enumerating subsets is O(2ⁿ). Aim for O(n · target).
- In the benchmark, values are 0..10 and `target = 2n`.

## Pattern & how to recognise it
- "**How many** subsets sum to `target`", each element once → **0/1 knapsack** with a count in
  each cell instead of a boolean.
- Same table as Subset Sum. Only the combine step changes: `or` becomes `+`.
- Lesson: [0/1 Knapsack](../../learn/knapsack-0-1/02-space-and-variants.md).

## Learning material
- `dp[s]` = the number of subsets of the numbers seen so far that sum to `s`. `dp[0] = 1` (the
  empty subset). For each number `x`: `dp[s] += dp[s - x]` for `s` from `target` down to `x`.
- **Zeros:** taking or skipping a 0 doesn't change the sum, so every 0 doubles the count. The
  update above handles it if the loop includes `s = x = 0`.
- Take the modulo after each addition.

## Hints
<details><summary>Hint 1</summary>

For each number, the subsets that reach `s` either skip it or take it. How do the two counts
combine?
</details>
<details><summary>Hint 2</summary>

What is the count for sum 0 before you look at any number?
</details>
<details><summary>Hint 3</summary>

Test your code on `[0, 0, 1]` with target 1. The answer is 4.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp = [1] + [0] * target`. For each `x`, for `s` from `target` down to `x`:
`dp[s] = (dp[s] + dp[s - x]) % MOD`. Return `dp[target]`.

Expected complexity: time O(n · target), space O(target).

</details>

## Follow-ups
- Target Sum (`+`/`−` signs) reduces to this count.
- Count subsets with a sum difference of `d` (same reduction as Target Sum).
- Count subsets when each element may be reused (that's Coin Change II, unbounded knapsack).
