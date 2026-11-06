# Binary Search

> Difficulty: **easy** · Patterns: binary-search · Sources: [leetcode](https://leetcode.com/problems/binary-search/), interviewbit

## Problem
Given an array `nums` sorted in ascending order (distinct values) and a `target`, return the index of
`target` in `nums`, or `-1` if it is not present.

## Examples
- `nums = [-1,0,3,5,9,12]`, `target = 9` → `4`
- `nums = [-1,0,3,5,9,12]`, `target = 2` → `-1`
- `nums = []`, `target = 1` → `-1`

## Constraints
- `0 <= len(nums) <= 10^4`, values distinct and sorted ascending.
- You must run in **O(log n)**. A linear scan is the naive O(n).

## Pattern & how to recognise it
- **Sorted input + "find"** → binary search: each comparison discards half of the remaining range.
- See [algo/notes/patterns.md](../../notes/patterns.md) (Binary Search) and
  [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- Keep an **invariant**: the target, if present, is in `[lo, hi]`. Loop `while lo <= hi`, set
  `mid = lo + (hi - lo) // 2`, and move `lo = mid + 1` or `hi = mid - 1`. When the loop ends the
  range is empty, so the target is absent.
- Off-by-one bugs come from mixing the conventions `[lo, hi]` (closed) and `[lo, hi)` (half-open).
  Pick one and keep it consistent.
- `lo + (hi - lo) // 2` avoids overflow in fixed-width languages (Go, Java). In Python it doesn't
  matter.
- Python's `bisect` module (`bisect_left`) implements the half-open lower-bound variant.
- Reading: https://leetcode.com/explore/learn/card/binary-search/

## Hints
<details><summary>Hint 1</summary>

Compare the target with the middle element. Which half can you throw away?
</details>
<details><summary>Hint 2</summary>

Decide what `lo` and `hi` mean, inclusive or exclusive, and make the loop condition match.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Closed range `[0, n-1]`: while `lo <= hi`, take `mid`. If it equals the target, return `mid`. If it
is smaller, set `lo = mid + 1`, else `hi = mid - 1`. Return -1. Time O(log n), space O(1).
</details>

## Follow-ups
- First / last position of a target with duplicates (LeetCode 34): lower bound and upper bound.
- Search insert position (LeetCode 35).
- Search in a rotated sorted array (LeetCode 33),
  [Search in Bitonic Array](../search-in-bitonic-array/README.md).
- Binary search on the answer: [Sqrt(x)](../sqrt-x/README.md).
