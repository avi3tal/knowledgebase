# Find Minimum in Rotated Sorted Array

> Difficulty: **medium** · Patterns: modified-binary-search · Sources: [leetcode](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

## Problem
An ascending array of **distinct** integers was rotated between 1 and n times, e.g.
`[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`. Return its minimum element in **O(log n)** time.

## Examples
- `nums = [3,4,5,1,2]` → `1`
- `nums = [4,5,6,7,0,1,2]` → `0`
- `nums = [11,13,15,17]` → `11` (rotated n times, i.e. back to sorted)

## Constraints
- `1 <= len(nums) <= 5000`, `-5000 <= nums[i] <= 5000`, values distinct.

## Pattern & how to recognise it
- **Rotated sorted** array + "O(log n)" → **Modified Binary Search**. You aren't looking for a
  given value: you're looking for the **boundary** where the order breaks (the only place where
  a value is smaller than the one before it).
- Lesson: [Modified Binary Search — variants](../../learn/modified-binary-search/02-variants.md).

## Learning material
- Compare `nums[mid]` with `nums[hi]`. If `nums[mid] > nums[hi]`, the drop is to the right of
  `mid`, so the minimum is in `(mid, hi]`. Otherwise `[mid, hi]` is sorted and the minimum is in
  `[lo, mid]`, **mid included**.
- Because `mid` can be the answer, this uses the `lo < hi` / `hi = mid` form of the loop, not
  `lo <= hi` / `hi = mid - 1`.
- [LeetCode 153](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/).

## Hints
<details><summary>Hint 1</summary>

Why is comparing with `nums[hi]` safer than comparing with `nums[lo]` when the array isn't
rotated at all?
</details>
<details><summary>Hint 2</summary>

When the right part is sorted, can `mid` itself be the minimum?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`lo, hi = 0, n-1`. While `lo < hi`: `mid = (lo + hi) // 2`; if `nums[mid] > nums[hi]`,
`lo = mid + 1`, else `hi = mid`. Return `nums[lo]`. Time O(log n), space O(1).
</details>

## Follow-ups
- With duplicates (LeetCode 154, hard): when `nums[mid] == nums[hi]`, do `hi -= 1`.
- Return the rotation count (the index of the minimum).
