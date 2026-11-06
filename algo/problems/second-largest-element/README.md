# Second Largest Element

> Difficulty: **easy** · Patterns: arrays-hashing · Sources: [educative](https://www.educative.io/courses/data-structures-coding-interviews-python)

## Problem
Given an integer list `nums`, return the **second largest distinct value**. The list contains at
least two distinct values.

## Examples
- `nums = [9, 2, 3, 6]` → `6`
- `nums = [4, 2, 1, 5, 0, 5]` → `4` (the repeated 5 is still the maximum)
- `nums = [-5, -1, -3]` → `-3`

## Constraints
- `2 <= len(nums) <= 10^5`, values fit in 32 bits, at least two distinct values.
- One pass, O(1) extra space.

## Pattern & how to recognise it
- **"Top-k with tiny k"** → keep k running variables instead of sorting. For k = 2: `first`,
  `second`.
- Sorting works (O(n log n)), and a heap generalises to any k (O(n log k)).

## Learning material
- Update rule for each `x`: if `x > first` → `second = first; first = x`; else if
  `first > x > second` → `second = x`. The strict `first > x` keeps duplicates of the maximum out
  of `second`.
- Initialise with −∞ (or from the first elements) — never with 0, or all-negative inputs break.
- Generalisation: k-th largest → min-heap of size k (see `algo/notes/heaps/`).

## Hints
<details><summary>Hint 1</summary>

You don't need the whole order, only the two best values. Keep both as you scan.
</details>
<details><summary>Hint 2</summary>

What should happen when you see a value equal to the current maximum?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`first = second = -inf`; for each `x`: `x > first` → shift; `first > x > second` → `second = x`.
Return `second`. Time O(n), space O(1).
</details>

## Follow-ups
- k-th largest element (LeetCode 215: heap or quickselect).
- No guarantee of two distinct values → return a sentinel / error.
