# Rotate Array (right by k)

> Difficulty: **medium** · Patterns: arrays-hashing, two-pointers · Sources: [educative](https://www.educative.io/courses/data-structures-coding-interviews-python), [leetcode](https://leetcode.com/problems/rotate-array/)

## Problem
Given an integer list `nums` and a non-negative `k`, rotate the list to the **right** by `k`
positions (the last `k` elements move to the front) and return it.

## Examples
- `nums = [10, 20, 30, 40, 50], k = 3` → `[30, 40, 50, 10, 20]`
- `nums = [1, 2, 3, 4], k = 1` → `[4, 1, 2, 3]`
- `nums = [1, 2, 3], k = 4` → `[3, 1, 2]` (`k` larger than `n` wraps: same as `k = 1`)

## Constraints
- `1 <= len(nums) <= 10^5`, `0 <= k <= 10^5`
- Target O(n) time; the follow-up asks for O(1) extra space.

## Pattern & how to recognise it
- First normalise `k %= n`.
- **Reversal trick:** reverse the whole array, then reverse the first `k` and the last `n - k`
  elements. Three in-place reversals with **two pointers** → O(n) time, O(1) space.
- Moving one element at a time `k` times (pop + insert at 0) is O(n·k) because every insert at the
  front shifts the whole list.

## Learning material
- Why reversal works: reversing `A B` (with `B` the last `k` elements) gives `rev(B) rev(A)`;
  reversing each part again yields `B A`.
- Alternatives: slicing `nums[-k:] + nums[:-k]` (O(n) extra space), or cyclic replacements
  following `i → (i + k) % n` cycles (O(1) space, trickier).
- LeetCode editorial: https://leetcode.com/problems/rotate-array/editorial/

## Hints
<details><summary>Hint 1</summary>

What is rotating by `k` the same as when `k >= n`?
</details>
<details><summary>Hint 2</summary>

What do you get if you reverse the whole array? How far is that from the answer?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`k %= n`; `reverse(0, n-1)`; `reverse(0, k-1)`; `reverse(k, n-1)`. Time O(n), space O(1).
</details>

## Follow-ups
- Left rotation; rotation of a linked list (LeetCode 61); rotating a matrix 90° (LeetCode 48).
- Search in a rotated sorted array (LeetCode 33).
