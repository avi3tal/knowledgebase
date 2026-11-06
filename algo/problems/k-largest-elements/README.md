# K Largest Elements

> Difficulty: **easy** · Patterns: heap · Sources: [interviewbit](https://www.interviewbit.com/problems/k-largest-elements/)

## Problem
Given an integer array `nums` and an integer `k`, return the `k` largest elements of the array,
in any order.

## Examples
- `nums = [11,3,4], k = 2` → `[11,4]`.
- `nums = [4,4,4,1,4], k = 3` → `[4,4,4]`. Duplicates count separately.
- `nums = [2,9,-1,7], k = 1` → `[9]`.

## Constraints
- `1 <= k <= len(nums) <= 10^5`, values fit in a 32-bit int.
- Target: O(n log k) time, O(k) extra space. Sorting (O(n log n)) also passes, but loses when
  `k << n` or when the input is a stream.

## Pattern & how to recognise it
- **"Top k / k largest / k smallest"** → a **heap of size k**. To keep the k *largest*, use a
  **min-heap**: its root is the weakest member of the current top k, so it's the one to evict
  when a bigger element arrives.
- Works on a stream: you never need more than k elements in memory.
- See [algo/notes/heaps/README.md](../../notes/heaps/README.md).

## Learning material
- **Binary heap costs:** peek O(1), push/pop O(log size), heapify O(size).
- **Min-heap of size k for the largest k:** heapify the first k elements. For every later `x`, if
  `x > heap[0]`, replace the root (`heapreplace`/`heappushpop` in Python). Total
  O(k + (n-k) log k).
- **Alternatives:** sort and slice, O(n log n). `heapq.nlargest(k, nums)`. **Quickselect**: partition
  around the (n-k)-th position, then take the right part; O(n) average, O(n²) worst case.
- Heap operations: [algo/notes/heaps/OPERATIONS.md](../../notes/heaps/OPERATIONS.md).

## Hints
<details><summary>Hint 1</summary>

You only ever need to remember k numbers. Which one of them is the first to be replaced?
</details>
<details><summary>Hint 2</summary>

A min-heap gives you the smallest of your current k in O(1).
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Heapify `nums[:k]` as a min-heap. For each remaining `x`, if `x > heap[0]`, pop the root and push
`x` (or `heapreplace`). Return the heap's contents. Time O(n log k), space O(k).
Quickselect gives O(n) on average.
</details>

## Follow-ups
- k **smallest** elements: a **max-heap** of size k. In Python, negate the values, or use a wrapper
  class like the one in [Implement a Max-Heap](../implement-max-heap/README.md).
- Return them sorted: sort the k results, O(k log k).
- Kth Largest Element in an Array (LeetCode 215) and
  [Kth Largest Element in a Stream](../kth-largest-in-stream/README.md).
- Top K Frequent Elements (LeetCode 347): count first, then a size-k heap over the counts.
