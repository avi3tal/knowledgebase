# Kth Largest Element in a Stream

> Difficulty: **easy** · Patterns: heap, design, top-k-elements · Sources: [leetcode](https://leetcode.com/problems/kth-largest-element-in-a-stream/)

## Problem
Design a class that keeps returning the **k-th largest** element of a growing stream:
- `KthLargest(k, nums)` initialises it with `k` and the initial numbers.
- `add(val)` appends `val` to the stream and returns the current k-th largest element.

## Examples
`KthLargest(3, [4,5,8,2])`, then `add(3) → 4`, `add(5) → 5`, `add(10) → 5`, `add(9) → 8`,
`add(4) → 8`.

## Constraints
- `1 <= k <= 10^4`, `0 <= len(nums) <= 10^4`, up to 10^4 calls to `add`.
- There are always at least k elements when `add` returns (nums may start with k-1 of them).

## Pattern & how to recognise it
- **"k-th largest / top-k" combined with "stream" or "after each insertion"** → a **heap of
  size k**. A min-heap keeps the k largest values seen so far, and its root is the answer.
- Re-sorting on each `add` would be O(n log n) per call, which is far too slow for 10^4 calls.
- See [algo/notes/heaps/README.md](../../notes/heaps/README.md) (patterns 1 and 3).

## Learning material
- **Binary heap:** peek O(1), push/pop O(log size), heapify O(n). Python's `heapq` is a
  min-heap over a list. Go has `container/heap`, where you implement `heap.Interface`.
- **Why a min-heap for the k *largest*?** You want to evict the smallest of the top k
  cheaply. That value is the min, so it sits at the root.
- Operations: [algo/notes/heaps/OPERATIONS.md](../../notes/heaps/OPERATIONS.md).

## Hints
<details><summary>Hint 1</summary>

You never need anything smaller than the current k-th largest again. What can you throw away?
</details>
<details><summary>Hint 2</summary>

Keep exactly k elements in a structure that gives you the smallest one in O(1).
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Min-heap capped at k. In the constructor, push each element and pop whenever the size exceeds
k. For `add`, push `val`, pop if the size exceeds k, and return `heap[0]`.
`add` is O(log k) time; space is O(k).
</details>

## Follow-ups
- Kth Largest Element in an Array (LeetCode 215): heap O(n log k) vs quickselect O(n) average.
- Find Median from Data Stream (LeetCode 295): two heaps.
- Top K Frequent Elements (LeetCode 347): count first, then a heap.
