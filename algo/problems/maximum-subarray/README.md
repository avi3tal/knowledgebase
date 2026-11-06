# Maximum Subarray (Max Sum Contiguous Subarray)

> Difficulty: **medium** · Patterns: dp-1d, greedy · Sources: [interviewbit](https://www.interviewbit.com/problems/max-sum-contiguous-subarray/), [leetcode](https://leetcode.com/problems/maximum-subarray/)

## Problem
Given a non-empty integer array `nums`, return the largest sum of any non-empty **contiguous**
subarray.

## Examples
- `nums = [1, 2, 3, 4, -10]` → `10` (`[1, 2, 3, 4]`)
- `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]` → `6` (`[4, -1, 2, 1]`)
- `nums = [-8, -3, -6]` → `-3` (all negative: the best single element)

## Constraints
- `1 <= len(nums) <= 10^6`, `-1000 <= nums[i] <= 1000`
- n = 10^6 → only O(n) passes.

## Pattern & how to recognise it
- "Best contiguous subarray" + one pass → **Kadane's algorithm**, a 1-D DP where
  `best_ending_here[i] = max(nums[i], best_ending_here[i-1] + nums[i])`.
- Greedy reading: a running sum that has gone negative can only hurt what follows → drop it.

## Learning material
- **Kadane:** keep `cur` (best sum of a subarray ending at `i`) and `best` (best seen so far).
  Initialise both to `nums[0]` — initialising `best = 0` breaks all-negative inputs.
- Divide and conquer also works in O(n log n) (best crossing subarray at the midpoint) — a common
  follow-up.
- Wikipedia: https://en.wikipedia.org/wiki/Maximum_subarray_problem

## Hints
<details><summary>Hint 1</summary>

What is the best subarray that **ends exactly at index i**, in terms of the one ending at `i-1`?
</details>
<details><summary>Hint 2</summary>

Either extend the previous subarray or start fresh at `i`. Track the overall maximum separately.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`cur = best = nums[0]`; for `x` in `nums[1:]`: `cur = max(x, cur + x)`, `best = max(best, cur)`.
Time O(n), space O(1).
</details>

## Follow-ups
- Return the start/end indices too (track where `cur` was last reset).
- Maximum circular subarray (LeetCode 918), maximum product subarray (LeetCode 152).
- Divide-and-conquer solution in O(n log n).
