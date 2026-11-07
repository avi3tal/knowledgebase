# Target Sum

> Difficulty: **medium** · Patterns: knapsack-0-1 · Sources: [leetcode](https://leetcode.com/problems/target-sum/)

## Problem
Given an array of non-negative integers `nums` and an integer `target`, put a `+` or a `−` in
front of **every** number and add them up. Return the **number of ways** to choose the signs so
that the expression equals `target`.

## Examples
- `nums = [1, 1, 1, 1, 1]`, `target = 3` → `5`: one of the five 1s gets the `−`.
- `nums = [1]`, `target = 1` → `1`.
- `nums = [0, 0, 1]`, `target = 1` → `4`: `±0 ±0 +1`.

## Constraints
- `1 <= len(nums) <= 20`, `0 <= nums[i] <= 1000`, `sum(nums) <= 1000`, `-1000 <= target <= 1000`.
- 2²⁰ ≈ 10⁶ sign choices is borderline in Python. The sum is small, so aim for O(n · sum).

## Pattern & how to recognise it
- A **binary choice per number** (`+` or `−`), each number used once, and you **count** the ways
  to hit a target → **0/1 knapsack** (count of subsets).
- The trick is the reduction: let `P` be the sum of the `+` numbers and `N` the sum of the `−`
  numbers. `P − N = target` and `P + N = total`, so `P = (total + target) / 2`. Count the subsets
  with that sum.
- Lesson: [0/1 Knapsack](../../learn/knapsack-0-1/02-space-and-variants.md).

## Learning material
- If `total + target` is odd, or `|target| > total`, the answer is 0.
- Otherwise run the count-of-subsets row up to `P` with `dp[0] = 1`, right to left per number.
- **Zeros** double the count (`+0` and `−0` are different choices). The count row handles them.
- Alternative: memoised recursion over `(i, running_sum)`, O(n · sum) states.

## Hints
<details><summary>Hint 1</summary>

The numbers with a `+` form a subset. What must that subset sum to?
</details>
<details><summary>Hint 2</summary>

Write `P − N = target` and `P + N = total`. Solve for `P`. When is there no solution?
</details>
<details><summary>Hint 3</summary>

Now it's Count of Subset Sum. Don't forget the zeros.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`total = sum(nums)`. If `abs(target) > total` or `(total + target)` is odd, return 0.
`P = (total + target) // 2`, `dp = [1] + [0] * P`. For each `x`, for `s` from `P` down to `x`:
`dp[s] += dp[s - x]`. Return `dp[P]`.

Expected complexity: time O(n · total), space O(total).

</details>

## Follow-ups
- Return one valid sign assignment.
- Allow `+`, `−` or skipping a number (three choices per item).
