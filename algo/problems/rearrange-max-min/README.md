# Rearrange Sorted Array in Max/Min Form

> Difficulty: **medium** · Patterns: two-pointers, math · Sources: [educative](https://www.educative.io/courses/data-structures-coding-interviews-python)

## Problem
Given a list `nums` sorted in ascending order, rearrange it so that the largest value comes
first, then the smallest, then the second largest, then the second smallest, and so on. Return
the rearranged list.

## Examples
- `nums = [1, 2, 3, 4, 5]` → `[5, 1, 4, 2, 3]`
- `nums = [1, 2, 3, 4, 5, 6]` → `[6, 1, 5, 2, 4, 3]`
- `nums = []` → `[]`

## Constraints
- `0 <= len(nums) <= 10^5`, sorted ascending; values may repeat or be negative.
- O(n) time. The follow-up asks for O(1) extra space.

## Pattern & how to recognise it
- **Alternately take from both ends of a sorted array → two pointers** `lo` and `hi` writing into
  a result list. O(n) time, O(n) space.
- Inserting/popping inside the list (`pop()` + `insert(pos, …)`) gives the right answer but each
  insert shifts the tail → O(n²).

## Learning material
- Two pointers: `hi = n-1, lo = 0`; alternately append `nums[hi--]` and `nums[lo++]` until they
  cross.
- **O(1)-space trick:** store two values in one slot. With `M = max + 1` (for non-negative
  values), write `nums[i] += (nums[source] % M) * M`, then divide everything by `M` at the end.
  `% M` reads the original value, `// M` the new one.
- Educative course: https://www.educative.io/courses/data-structures-coding-interviews-python

## Hints
<details><summary>Hint 1</summary>

The output alternates between the two ends of the sorted input. Which two indices do you need?
</details>
<details><summary>Hint 2</summary>

For O(1) space: can a single integer hold both its old and its new value?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Two pointers into a new list: alternately take `nums[hi]` and `nums[lo]`, moving inward.
Time O(n), space O(n). The modulo-encoding variant does it in place in O(1) extra space.
</details>

## Follow-ups
- In place with O(1) extra space (modulo encoding; needs care with negatives).
- Wiggle sort: `nums[0] <= nums[1] >= nums[2] <= …` on unsorted input (LeetCode 280 / 324).
