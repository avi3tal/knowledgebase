# Implement a Max-Heap

> Difficulty: **easy** · Patterns: heap, design · Sources: [interviewbit](https://www.interviewbit.com/courses/programming/heaps-and-maps/)

## Problem
Design a `MaxHeap` class (a max priority queue of integers):
- `MaxHeap()` creates an empty heap.
- `push(val)` inserts `val`.
- `pop()` removes and returns the **largest** value.
- `top()` returns the largest value without removing it.

`pop` and `top` are only called on a non-empty heap. Python's `heapq` is a **min**-heap, so the
exercise is to get max-heap behaviour, either on top of it or from scratch.

## Examples
`MaxHeap()`, `push(3)`, `push(10)`, `push(5)`, `top() → 10`, `pop() → 10`, `top() → 5`.

## Constraints
- Up to `10^5` operations; values fit in a 32-bit int (negatives allowed); duplicates allowed.
- Target: `push`/`pop` O(log n), `top` O(1); O(n) space.

## Pattern & how to recognise it
- **"Repeatedly take the largest/smallest while inserting"** → a binary heap (priority queue).
  A sorted list costs O(n) per insert, and an unsorted list costs O(n) per pop.
- See [algo/notes/heaps/README.md](../../notes/heaps/README.md),
  [algo/notes/heaps/BASICS.md](../../notes/heaps/BASICS.md) and the reference implementation in
  [algo/ds/heap/python](../../ds/heap/python).

## Learning material
- **Array layout:** the children of index `i` are at `2i+1` and `2i+2`, and its parent is at
  `(i-1)//2`. Max-heap property: every parent is `>=` its children, so the root is the max.
- **push:** append, then **sift up** (swap with the parent while it's bigger). O(log n).
- **pop:** save the root, move the last element to the root, then **sift down** (swap with the
  larger child while it's smaller). O(log n).
- **Max-heap on top of a min-heap:** store `-val`, which works for numbers. Or wrap each value in an
  object whose `__lt__` is reversed, which works for any comparable type. If you wrap, unwrap
  before returning, so callers get plain values back.
- Go: `container/heap` with `Less(i, j) = h[i] > h[j]`.
- Details: [algo/notes/heaps/OPERATIONS.md](../../notes/heaps/OPERATIONS.md).

## Hints
<details><summary>Hint 1</summary>

A min-heap of negated numbers pops the most negative one first. Which original number is that?
</details>
<details><summary>Hint 2</summary>

From scratch: after `pop` moves the last element to the root, which child should it swap with?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

With `heapq`: `push(v)` is `heappush(h, -v)`; `pop()` returns `-heappop(h)`; `top()` returns
`-h[0]`. From scratch: an array with sift-up on push and sift-down (towards the larger child) on
pop. `push`/`pop` O(log n), `top` O(1), space O(n).
</details>

## Follow-ups
- Build a heap from an array in O(n) (bottom-up heapify), and explain why it isn't O(n log n).
- Heap sort: [algo/notes/heaps/HEAP_SORT.md](../../notes/heaps/HEAP_SORT.md).
- k smallest elements with a size-k max-heap. The legacy attempt includes this; see
  [K Largest Elements](../k-largest-elements/README.md) for the mirror problem.
- Support `update(key)` / `remove(item)`: an indexed heap with a position map (as in Dijkstra).
- Find Median from Data Stream (LeetCode 295): a max-heap and a min-heap together.
