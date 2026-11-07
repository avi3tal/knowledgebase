# Sliding Window Median

> Difficulty: **hard** · Patterns: two-heaps, sliding-window · Sources: [leetcode](https://leetcode.com/problems/sliding-window-median/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Given an integer array `nums` and a window size `k`, a window of size `k` slides from the left of
the array to the right, one position at a time. Return the **median of every window**, as floats.
With an even `k` the median is the average of the two middle values.

## Examples
- `nums = [1,3,-1,-3,5,3,6,7], k = 3` → `[1.0, -1.0, -1.0, 3.0, 5.0, 6.0]`.
  The windows are `[1,3,-1]`, `[3,-1,-3]`, `[-1,-3,5]`, `[-3,5,3]`, `[5,3,6]`, `[3,6,7]`.
- `nums = [1,4,2,3], k = 2` → `[2.5, 3.0, 2.5]`.

## Constraints
- `1 <= k <= len(nums) <= 10^5`, `-2^31 <= nums[i] <= 2^31 - 1`.
- Sorting every window is O(n·k log k), too slow when n and k are both large. Aim for O(n log n)
  (O(n log k) with a balanced BST).
- Values reach the int32 limits: average two middles without overflowing (Go: use `int64` or
  `float64`).

## Pattern & how to recognise it
- "**Median**" of a changing set → **two heaps** (max-heap for the small half, min-heap for the
  large half).
- "**Sliding window**" → elements also **leave**, and a heap can't delete an arbitrary element
  cheaply. You need **lazy deletion** (or a sorted container).
- Lesson: [Two Heaps](../../learn/two-heaps/01-intro.md) (Variant 1 in the variants).

## Learning material
- **Lazy deletion:** remember values to delete in a counter. Remove them only when they reach a
  heap's **top**. Keep the valid sizes of both halves yourself, since `len(heap)` also counts the
  dead entries.
- Each element is pushed once and popped at most once. Stale entries can pile up below the tops,
  so a heap may hold up to n entries: O(n log n) in the worst case.
- Alternative: a sorted list with binary-search insert/remove (O(k) per step in Python's list,
  O(log k) with a balanced BST or `sortedcontainers.SortedList`).

## Hints
<details><summary>Hint 1</summary>

Start from the running-median solution. What's the only new operation when the window slides?
</details>
<details><summary>Hint 2</summary>

Instead of searching a heap for the value that leaves, write it down in a "to delete" counter and
fix the size counts. When does a dead value actually get in your way?
</details>
<details><summary>Hint 3</summary>

Only when it sits at a top. After every change, pop dead values off both tops before reading the
median or rebalancing.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Two heaps `lo` (max, negated) and `hi` (min), valid sizes `lo_size` and `hi_size`, and a counter
`delayed`. Insert as in the running median. When `nums[i - k]` leaves: `delayed[x] += 1`, decrease
`lo_size` if `x <= top(lo)`, otherwise `hi_size`, then prune the top of that heap. Rebalance so
`lo_size` is `hi_size` or `hi_size + 1`, pruning the top after each move. Read the median from the
tops once the first window is full.

Time O(n log n) (the heaps may hold stale entries), space O(n).
</details>

## Follow-ups
- Return the sliding window **mean** or **mode** instead.
- Sliding window **maximum**: a monotonic deque does it in O(n).
- Percentiles other than 50% (keep `lo` at a fixed fraction of the window).
