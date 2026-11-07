# Find Pivot Index

> Difficulty: **easy** · Patterns: prefix-sum · Sources: [leetcode](https://leetcode.com/problems/find-pivot-index/)

## Problem
Given an integer array `nums`, return the **leftmost** index `i` such that the sum of the elements
strictly to the left of `i` equals the sum of the elements strictly to the right of `i`. An empty
side sums to 0. Return `-1` if no such index exists.

## Examples
- `nums = [1, 7, 3, 6, 5, 6]` → `3`: left 1 + 7 + 3 = 11, right 5 + 6 = 11.
- `nums = [1, 2, 3]` → `-1`.
- `nums = [2, 1, -1]` → `0`: the left side is empty (0) and the right side is 1 + (−1) = 0.

## Constraints
- `1 <= nums.length <= 10^4`, `-1000 <= nums[i] <= 1000` (negatives allowed).
- Summing both sides for every index is O(n²). Aim for O(n) time and O(1) extra space.

## Pattern & how to recognise it
- "Sum of everything left / right of i" for every i → **prefix sums**. Once you know the
  total, the right sum is `total − left − nums[i]`, so one running sum is enough.
- Lesson: [Prefix Sum](../../learn/prefix-sum/01-intro.md).

## Learning material
- A **prefix sum** `P[i] = nums[0] + … + nums[i−1]` turns any range sum into one subtraction:
  `sum(nums[l..r]) = P[r+1] − P[l]`.
- When you scan left to right, the running total *is* the prefix sum, so you often don't need
  the array at all.
- [Prefix sum (Wikipedia)](https://en.wikipedia.org/wiki/Prefix_sum)

## Hints
<details><summary>Hint 1</summary>

If you know the sum of the whole array and the sum to the left of `i`, what's the sum to the
right of `i`?
</details>
<details><summary>Hint 2</summary>

Keep the left sum as a running total while you scan. Update it after checking index `i`, not before.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`total = sum(nums)`, `left = 0`. For each `i`: if `left == total − left − nums[i]` return `i`;
then `left += nums[i]`. Return −1.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Return **all** pivot indices.
- Split the array into two non-empty parts with equal sums (no pivot element).
- Find the index where the left and right sums differ the least.
