# Equal Subset Sum Partition

> Difficulty: **medium** · Patterns: knapsack-0-1 · Sources: [leetcode](https://leetcode.com/problems/partition-equal-subset-sum/)

## Problem
Given an array of positive integers `nums`, return `true` if you can split it into **two
subsets with equal sums** (every element goes into exactly one of the two), else `false`.

## Examples
- `[1, 5, 11, 5]` → `true`: {1, 5, 5} and {11} both sum to 11.
- `[1, 2, 3, 5]` → `false`: the total is 11, which is odd.
- `[1, 2, 3, 4]` → `true`: {1, 4} and {2, 3}.

## Constraints
- `1 <= len(nums) <= 200`, `1 <= nums[i] <= 100`.
- 2ⁿ ways to split is far too many. The total is at most 20 000, so O(n · total) is fine.

## Pattern & how to recognise it
- "Split into **two groups**" where each element goes to one side → pick **one** subset; the
  rest is the other side. That's a yes/no choice per element, used once → **0/1 knapsack**.
- Equal sums means one subset sums to exactly `total / 2`. So this is Subset Sum in disguise.
- Lesson: [0/1 Knapsack](../../learn/knapsack-0-1/02-space-and-variants.md).

## Learning material
- Reduction: `A + B = total` and `A = B` give `A = total / 2`. If `total` is odd, it's impossible
  before you build anything.
- Then it's a boolean knapsack row over sums `0..total/2`, filled right to left per number.
  O(n · total) time, O(total) space.
- Read: [Partition problem (Wikipedia)](https://en.wikipedia.org/wiki/Partition_problem).

## Hints
<details><summary>Hint 1</summary>

If two subsets have equal sums, what does each of them sum to?
</details>
<details><summary>Hint 2</summary>

Now you need to know whether *one* subset reaches a specific sum. Which lesson problem is that?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`total = sum(nums)`. If it's odd, return false. `half = total // 2`, `dp = [True] + [False] * half`.
For each `x`, for `s` from `half` down to `x`: `dp[s] |= dp[s - x]`. Return `dp[half]`.

Expected complexity: time O(n · total), space O(total).

</details>

## Follow-ups
- Return the two subsets.
- Partition into `k` equal-sum subsets (LeetCode 698): backtracking with pruning or bitmask DP.
- Split into two halves with the smallest difference (Minimum Subset Sum Difference).
