# Median of Two Sorted Arrays

> Difficulty: **hard** · Patterns: binary-search · Sources: [leetcode](https://leetcode.com/problems/median-of-two-sorted-arrays/), [interviewbit](https://www.interviewbit.com/problems/median-of-array/)

## Problem
Given two sorted arrays `nums1` (size m) and `nums2` (size n), return the median of the multiset
formed by both. For an even total, the median is the mean of the two middle values. The overall run
time should be **O(log (m+n))**.

## Examples
- `nums1 = [1,4,5]`, `nums2 = [2,3]` → `3.0` (merged `1 2 3 4 5`)
- `nums1 = [1,2]`, `nums2 = [3,4]` → `2.5`
- `nums1 = []`, `nums2 = [1]` → `1.0`

## Constraints
- `0 <= m, n <= 1000`, `1 <= m + n`, values in `[-10^6, 10^6]`.
- Merging (O(m+n)) is the easy answer. The required O(log(min(m, n))) needs binary search on a
  **partition**. In the benchmark both arrays have length n, so the target is O(log n).

## Pattern & how to recognise it
- **Two sorted arrays + "k-th smallest / median" + a log-time requirement** → binary search, but
  over *how many elements to take from the smaller array*, not over values.
- See [algo/notes/patterns.md](../../notes/patterns.md) (Binary Search) and
  [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- **Partition view:** take `i` elements from `A` (the shorter array) and `j = (m+n+1)//2 - i` from
  `B` into the left half. The split is correct iff `A[i-1] <= B[j]` and `B[j-1] <= A[i]`, treating
  missing elements as -∞ / +∞.
  - If `A[i-1] > B[j]`, `i` is too big, so move left.
  - Otherwise move right.
- At the correct split the median is `max(left)` for an odd total, or `(max(left) + min(right)) / 2`
  for an even total.
- Binary searching `i` over `[0, m]` costs O(log m). Always search the **shorter** array so that `j`
  stays in range.
- **k-th smallest alternative:** compare `A[k/2]` and `B[k/2]` and discard k/2 elements each step.
  This is O(log k).
- Reading: https://leetcode.com/problems/median-of-two-sorted-arrays/editorial/

## Hints
<details><summary>Hint 1</summary>

The median splits the merged array into two halves of (almost) equal size. If you knew how many of
the left-half elements come from `A`, you'd know how many come from `B`.
</details>
<details><summary>Hint 2</summary>

Binary search that count. Compare the four boundary elements to decide which way to move.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Make `A` the shorter array. Binary search `i` in `[0, m]` with `j = (m+n+1)//2 - i`. Define
`Aleft = A[i-1]` or -∞, `Aright = A[i]` or +∞, and the same for B. If `Aleft <= Bright` and
`Bleft <= Aright`, the split is found: the median is `max(Aleft, Bleft)` for an odd total, or the
average of that and `min(Aright, Bright)` for an even total. Otherwise move `i`.
Time O(log min(m, n)), space O(1).
</details>

## Follow-ups
- k-th smallest element of two sorted arrays.
- Median of a data stream (two heaps).
- Median of k sorted arrays (binary search on the value range).
