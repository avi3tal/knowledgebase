# Sort an Array

> Difficulty: **medium** · Patterns: sorting, heap, recursion · Sources: [leetcode](https://leetcode.com/problems/sort-an-array/), [programiz](https://www.programiz.com/dsa/heap-sort), [geeksforgeeks](https://www.geeksforgeeks.org/merge-sort/)

## Problem
Sort the integer array `nums` in ascending order **in place**, without built-in sort functions.
(LeetCode returns the array. Here the function returns nothing and `nums` itself is checked.)

## Examples
- `[5, 2, 3, 1]` → `[1, 2, 3, 5]`
- `[5, 1, 1, 2, 0, 0]` → `[0, 0, 1, 1, 2, 5]` (duplicates are kept)
- `[]` → `[]`

## Constraints
- `0 <= len(nums) <= 5·10^4`, `-5·10^4 <= nums[i] <= 5·10^4`.
- O(n²) sorts (bubble, insertion, selection) time out. Aim for **O(n log n)**. LeetCode's tests
  include sorted and all-equal inputs that break naive quicksort.

## Pattern & how to recognise it
- **"Implement sorting yourself"** → pick a comparison sort with an O(n log n) guarantee, and know
  each one's trade-offs. The comparison lower bound is Ω(n log n). Beating it needs non-comparison
  sorts (counting / radix) that exploit a bounded value range, as here.
- See [algo/notes/sorting/](../../notes/sorting/README.md), [merge sort](../../notes/sorting/merge_sort.md),
  [heap sort](../../notes/heaps/HEAP_SORT.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
| Algorithm | Time (best / avg / worst) | Extra space | Stable | Notes |
|---|---|---|---|---|
| Merge sort | n log n / n log n / n log n | O(n) | yes | divide, sort halves, merge |
| Quicksort | n log n / n log n / **n²** | O(log n) stack (O(n) worst) | no | random pivot or median-of-3. Use 3-way partition for duplicates |
| Heap sort | n log n / n log n / n log n | O(1) | no | build a max-heap in O(n), then pop the max to the end n times |
| Counting sort | n + k | O(k) | yes | k = value range (here 10^5) |

- **Heap sort:** `heapify` sifts a node down. Building the heap bottom-up from index `n//2 - 1` to 0
  costs O(n). Then swap the root with the last element, shrink the heap and sift down, n times.
- **Quicksort pitfalls:** a last-element pivot on sorted input gives O(n²) time and O(n) recursion
  depth (a RecursionError in Python at ~1000). All-equal values do the same with a strict `<`
  partition.
- **Merge sort with slices** (`l = arr[:mid]`) allocates O(n log n) in total, but only O(n) is live
  at once.

## Hints
<details><summary>Hint 1</summary>

Pick an algorithm whose worst case is O(n log n): merge sort or heap sort.
</details>
<details><summary>Hint 2</summary>

For quicksort, randomise the pivot and handle equal keys (3-way partition) to avoid the O(n²) traps.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Heap sort: build a max-heap in place by sifting down from `n//2 - 1` to 0. Then for `end` from
`n-1` to 1, swap `nums[0]` and `nums[end]` and sift down the root within `[0, end)`.
Time O(n log n), space O(1). Merge sort is also O(n log n), with O(n) space and stability.
</details>

## Follow-ups
- Make quicksort robust: random pivot, 3-way (Dutch flag) partition, recurse on the smaller side.
- Bottom-up (iterative) merge sort. Sort a linked list in O(n log n) (LeetCode 148).
- Counting / radix sort for bounded integers in O(n + k).
- Kth largest element via quickselect (LeetCode 215).
