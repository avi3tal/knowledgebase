# Minimum Subset Sum Difference

> Difficulty: **medium** · Patterns: knapsack-0-1 · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/problems/minimum-sum-partition3317/1)

## Problem
Split an array of positive integers `nums` into two subsets (every element goes into exactly one;
a subset may be empty). Return the **smallest possible absolute difference** between the two
subset sums.

## Examples
- `[1, 2, 3, 9]` → `3`: {1, 2, 3} = 6 and {9} = 9.
- `[1, 2, 7, 1, 5]` → `0`: {1, 2, 5} = 8 and {7, 1} = 8.
- `[1, 3, 100, 4]` → `92`: {100} and {1, 3, 4} = 8.

## Constraints
- `1 <= len(nums) <= 200`, `1 <= nums[i] <= 100`.
- 2ⁿ splits is too many. The total is at most 20 000, so O(n · total) is fine.
- In the benchmark, values are 1..10.

## Pattern & how to recognise it
- "Split into two groups" with a yes/no choice per element, each used once → **0/1 knapsack**.
- If one side sums to `s`, the other is `total - s` and the difference is `total - 2s`. So you
  want the reachable `s` **closest to `total / 2` from below**.
- Greedy (put each number on the lighter side) fails, e.g. `[8, 7, 6, 5, 4]`.
- Lesson: [0/1 Knapsack](../../learn/knapsack-0-1/02-space-and-variants.md).

## Learning material
- Fill the Subset Sum boolean row for sums `0..total // 2`.
- Then scan from `total // 2` down and stop at the first reachable `s`. Return `total - 2s`.
- It's the same problem as [Last Stone Weight II (LeetCode 1049)](https://leetcode.com/problems/last-stone-weight-ii/).

## Hints
<details><summary>Hint 1</summary>

If you know one side's sum, you know the difference. Which sums can one side have?
</details>
<details><summary>Hint 2</summary>

You only need sums up to half the total. Which reachable sum is the best?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`total = sum(nums)`, `half = total // 2`. Boolean row `dp[0..half]` with `dp[0] = True`; for each
`x`, for `s` from `half` down to `x`: `dp[s] |= dp[s - x]`. Find the largest `s` with `dp[s]` and
return `total - 2 * s`.

Expected complexity: time O(n · total), space O(total).

</details>

## Follow-ups
- Return the two subsets (keep the 2-D table and walk back).
- Split into two subsets of **equal size** with the minimum difference (LeetCode 2035):
  meet in the middle, since the values are large there.
