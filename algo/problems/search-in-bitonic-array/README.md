# Search in Bitonic Array

> Difficulty: **medium** · Patterns: binary-search · Sources: [interviewbit](https://www.interviewbit.com/problems/search-in-bitonic-array/)

## Problem
A **bitonic** array of distinct integers first strictly increases and then strictly decreases.
Given such an array `A` and a value `B`, return the index of `B` in `A`, or `-1` if it is absent,
in O(log N) time.

## Examples
- `A = [3, 9, 10, 20, 17, 5, 1]`, `B = 20` → `3` (the peak)
- `A = [5, 6, 7, 8, 9, 10, 3, 2, 1]`, `B = 30` → `-1`
- `A = [1, 20, 50, 40, 10]`, `B = 5` → `-1`

## Constraints
- `3 <= N <= 10^5`, distinct values. The peak is strictly inside the array (there is both an
  increasing and a decreasing part).
- O(N) scanning is the naive answer. Aim for **O(log N)**: three binary searches.

## Pattern & how to recognise it
- **"Increasing then decreasing" (mountain array)** → first binary search for the **peak** by
  comparing `A[mid]` with `A[mid+1]`. Then do an ordinary binary search on each monotone side, with
  the comparison flipped on the decreasing side.
- See [algo/notes/patterns.md](../../notes/patterns.md) (Binary Search).

## Learning material
- **Peak search:** if `A[mid] < A[mid+1]` you're on the rising slope, so the peak is right of mid.
  Otherwise it's at mid or to the left. With `lo < hi` and `hi = mid`, this converges to the peak
  without reading `A[mid-1]`, so no wrap-around at index 0.
- **Searching both halves:** search `[0, peak]` ascending, and if not found, search `[peak+1, N-1]`
  descending. The ranges must not overlap, or the peak gets found twice. If you combine two results,
  don't add the indices together.
- Python's `A[-1]` silently reads the last element, so a peak search that reads `A[mid-1]` at
  `mid = 0` gives wrong results instead of crashing.
- Total cost: 3 × O(log N).

## Hints
<details><summary>Hint 1</summary>

Find the maximum first. Compare each element with its right neighbour to know which slope you're on.
</details>
<details><summary>Hint 2</summary>

Each side of the peak is sorted. Reuse binary search, flipping the comparison for the descending part.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

1. Find the peak `p`: `lo, hi = 0, N-1`; while `lo < hi`, if `A[mid] < A[mid+1]`, set `lo = mid+1`,
   else `hi = mid`.
2. Binary search `B` in the ascending `A[0..p]`. If found, return the index.
3. Binary search `B` in the descending `A[p+1..N-1]`. Return the index or -1.

Time O(log N), space O(1).
</details>

## Follow-ups
- Peak Index in a Mountain Array (LeetCode 852), Find in Mountain Array (LeetCode 1095).
- Find Peak Element with many peaks (LeetCode 162).
- Search in Rotated Sorted Array (LeetCode 33). [Binary Search](../binary-search/README.md) basics.
