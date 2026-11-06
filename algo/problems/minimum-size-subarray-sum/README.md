# Minimum Size Subarray Sum

> Difficulty: **medium** · Patterns: sliding-window · Sources: [leetcode](https://leetcode.com/problems/minimum-size-subarray-sum/)

## Problem
Given an array of **positive** integers `nums` and a positive integer `target`, return the
minimal length of a contiguous subarray whose sum is **greater than or equal to** `target`.
If there is none, return `0`.

## Examples
- `target = 7, nums = [2,3,1,2,4,3]` → `2` (`[4,3]`)
- `target = 4, nums = [1,4,4]` → `1`
- `target = 11, nums = [1,1,1,1,1,1,1,1]` → `0`

## Constraints
- `1 <= len(nums) <= 10^5`, `1 <= nums[i] <= 10^4`, `1 <= target <= 10^9`.
- All values are **positive**. That's what makes the window approach correct.

## Pattern & how to recognise it
- "**Shortest contiguous** subarray **such that** sum ≥ target" → **dynamic sliding window**.
  Here you shrink **while the window is still valid**, recording the answer *inside* the shrink
  loop.
- It works because the numbers are positive: growing the window can only increase the sum, and
  shrinking can only decrease it. With negatives, use prefix sums instead (see the lesson's
  anti-signals).
- Lesson: [Sliding Window](../../learn/sliding-window/02-dynamic.md).

## Learning material
- Running `window_sum`. For each `end`, add `nums[end]`. Then, while `window_sum >= target`,
  record `end - start + 1`, subtract `nums[start]` and move `start` right.
- `start` never moves left, so the total work is O(n) even with the nested `while`.

## Hints
<details><summary>Hint 1</summary>

Once a window reaches the target, can a *longer* window ending at the same place be the answer?
</details>
<details><summary>Hint 2</summary>

As soon as the sum reaches the target, try to shrink from the left as much as possible.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`start = 0, total = 0, best = inf`. For each `end`: `total += nums[end]`. Then, while
`total >= target`: `best = min(best, end - start + 1)`, `total -= nums[start]`, `start += 1`.
Return `0 if best == inf else best`. Time O(n), space O(1).
</details>

## Follow-ups
- O(n log n) alternative: prefix sums plus binary search for each start.
- With negative numbers: Shortest Subarray with Sum at Least K (LeetCode 862), which uses a
  monotonic deque.
