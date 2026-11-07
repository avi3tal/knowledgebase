# Kth Smallest Element in a Sorted Matrix

> Difficulty: **medium** · Patterns: k-way-merge, binary-search · Sources: [leetcode](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Given an `n × n` `matrix` where every **row and every column** is sorted in ascending order,
return the `k`-th smallest element in the matrix. It's the k-th smallest in sorted order, counting
duplicates, not the k-th distinct value.

## Examples
- `matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8` → `13`. Sorted: 1, 5, 9, 10, 11, 12, 13,
  **13**, 15.
- `matrix = [[-5]], k = 1` → `-5`.

## Constraints
- `1 <= n <= 300`, `-10^9 <= matrix[i][j] <= 10^9`, `1 <= k <= n²`.
- Flattening and sorting is O(n² log n). Aim for O(k log n), or O(n log(range)) with binary search.

## Pattern & how to recognise it
- Every **row is a sorted list**, so this is "k-th smallest across n sorted lists" → **K-way
  Merge**: a min-heap seeded with the first column.
- The sorted **columns** add a second option: **binary search on the value** and count the
  elements ≤ mid with a staircase walk.
- Lesson: [K-way Merge](../../learn/k-way-merge/01-intro.md) (Variant 1 and "equal-length rows" in
  the variants).

## Learning material
- Heap entries `(value, row, col)`. After popping `(v, r, c)`, push the right-hand neighbour
  `(matrix[r][c + 1], r, c + 1)`.
- Only the first `min(n, k)` rows can contain the k-th smallest (row `r`'s first element is
  already ≥ r other elements).
- **Staircase count:** start at the bottom-left. If the cell is ≤ mid, the whole column above it is
  too, so add `row + 1` and move right. Otherwise move up. O(n) per count.

## Hints
<details><summary>Hint 1</summary>

Treat each row as a sorted list. What's the smallest element you haven't taken yet in each row?
</details>
<details><summary>Hint 2</summary>

Seed a min-heap with the first element of each row (at most k rows). Pop k times, and after each
pop push the next element of the same row.
</details>
<details><summary>Hint 3</summary>

For O(1) extra space: binary search on the value range. How many elements are ≤ mid can be counted
in O(n) thanks to the sorted columns.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Heap: push `(matrix[r][0], r, 0)` for `r < min(n, k)`. Pop k − 1 times, each time pushing
`(matrix[r][c + 1], r, c + 1)` when `c + 1 < n`. The top is the answer. Time O(min(n, k) + k log n),
space O(n).

Binary search: `lo = matrix[0][0]`, `hi = matrix[n-1][n-1]`. While `lo < hi`: `mid = (lo + hi) // 2`.
If count(≤ mid) ≥ k, `hi = mid`, else `lo = mid + 1`. Return `lo`. Time O(n log(range)), space O(1).
</details>

## Follow-ups
- The matrix is `m × n` (not square): same ideas.
- Only the rows are sorted (not the columns): the heap still works, the staircase count doesn't.
- Find the k-th smallest pair sum of two sorted arrays: the sum table is a sorted matrix you never
  build.
