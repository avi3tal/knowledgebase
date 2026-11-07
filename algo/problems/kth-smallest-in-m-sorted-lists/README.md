# Kth Smallest Number in M Sorted Lists

> Difficulty: **medium** · Patterns: k-way-merge, heap · Sources: [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Given `m` lists of integers, each sorted in ascending order (some may be empty), and an integer
`k`, return the `k`-th smallest number among **all** the lists combined. Duplicates count
separately: in `[1, 1, 2]` the 2nd smallest is 1.

## Examples
- `lists = [[2,6,8],[3,6,7],[1,3,4]], k = 5` → `4`. The merged order is 1, 2, 3, 3, **4**, 6, 6,
  7, 8.
- `lists = [[5,8,9],[1,7]], k = 3` → `7`.

## Constraints
- `1 <= m <= 10^3`, total length `N <= 10^5`, `1 <= k <= N`.
- Merging everything and sorting is O(N log N) and reads every element. Aim for O(k log m).

## Pattern & how to recognise it
- "**k-th smallest**" across **several sorted lists** → **K-way Merge**: a min-heap of the list
  heads, popped k times.
- The lists are already sorted, so a size-k heap over every element (Top 'K' Elements) would waste
  the order you were given.
- Lesson: [K-way Merge](../../learn/k-way-merge/01-intro.md) (Variant 1 in the variants).

## Learning material
- A heap entry needs the **value** (to order by), the **list index** (where to refill from) and the
  **element index** (what comes next): `(value, i, j)`.
- Each pop is O(log m) and you stop after k pops, so you never look past the k-th element.
- [heapq docs](https://docs.python.org/3/library/heapq.html).

## Hints
<details><summary>Hint 1</summary>

Which elements could possibly be the overall smallest? How many candidates are there?
</details>
<details><summary>Hint 2</summary>

Keep one candidate per list in a min-heap. After popping one, which element becomes that list's
new candidate?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Push `(lists[i][0], i, 0)` for every non-empty list. Pop k times. After each pop `(v, i, j)`, push
`(lists[i][j + 1], i, j + 1)` if it exists. The k-th popped value is the answer.

Time O(m + k log m), space O(m).
</details>

## Follow-ups
- The median of all the lists (k = N / 2).
- The lists are huge files on disk: the same heap streams them with O(m) memory.
- Binary search on the value: count elements ≤ mid with `bisect` in each list,
  O(m log N · log(range)).
