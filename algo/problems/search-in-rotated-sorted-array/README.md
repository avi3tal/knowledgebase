# Search in Rotated Sorted Array

> Difficulty: **medium** · Patterns: modified-binary-search · Sources: [leetcode](https://leetcode.com/problems/search-in-rotated-sorted-array/)

## Problem
An array sorted in ascending order with **distinct** values was rotated at some unknown pivot,
e.g. `[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`. Given the rotated array `nums` and a `target`,
return the index of `target`, or `-1` if it's absent. The run time must be **O(log n)**.

## Examples
- `nums = [4,5,6,7,0,1,2]`, `target = 0` → `4`
- `nums = [4,5,6,7,0,1,2]`, `target = 3` → `-1`
- `nums = [1]`, `target = 0` → `-1`

## Constraints
- `1 <= len(nums) <= 5000`, `-10^4 <= nums[i], target <= 10^4`, values distinct.
- The array may not be rotated at all.

## Pattern & how to recognise it
- **Sorted, but rotated** + "O(log n)" → **Modified Binary Search**. A plain binary search fails
  because the array isn't sorted end to end. But cut it anywhere and **at least one half is
  sorted**, and you can tell which.
- Lesson: [Modified Binary Search — variants](../../learn/modified-binary-search/02-variants.md).

## Learning material
- Compare `nums[lo]` with `nums[mid]`. If `nums[lo] <= nums[mid]`, the left half `[lo, mid]` is
  sorted; otherwise the right half `[mid, hi]` is.
- In a sorted half, a range check (`nums[lo] <= target < nums[mid]`) tells you whether the
  target can be there. If it can't, it must be in the other half.
- [LeetCode 33](https://leetcode.com/problems/search-in-rotated-sorted-array/).

## Hints
<details><summary>Hint 1</summary>

Draw the array as two rising slopes. Where can `mid` land, and which part is guaranteed to be
sorted in each case?
</details>
<details><summary>Hint 2</summary>

You can only trust a range check on the half that is sorted.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`lo, hi = 0, n-1`. While `lo <= hi`: `mid`; if `nums[mid] == target` return `mid`. If
`nums[lo] <= nums[mid]` (left sorted): go left (`hi = mid-1`) when `nums[lo] <= target <
nums[mid]`, else right. Otherwise (right sorted): go right (`lo = mid+1`) when `nums[mid] <
target <= nums[hi]`, else left. Return `-1`. Time O(log n), space O(1).
</details>

## Follow-ups
- With duplicates (LeetCode 81): `nums[lo] == nums[mid]` gives no information, so shrink `lo`
  by one. The worst case becomes O(n).
- Find the rotation point first (`find-minimum-in-rotated-sorted-array`), then binary search the
  correct half.
