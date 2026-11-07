# Find Right Interval

> Difficulty: **medium** · Patterns: two-heaps, intervals · Sources: [leetcode](https://leetcode.com/problems/find-right-interval/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
You're given an array of `intervals`, where `intervals[i] = [start_i, end_i]` and every
`start_i` is **unique**.

The **right interval** of interval `i` is an interval `j` with `start_j >= end_i` whose
`start_j` is as **small** as possible. `j` may equal `i` (a point interval `[x, x]` is its
own right interval).

Return an array where entry `i` is the index of interval `i`'s right interval, or `-1` if
there is none.

## Examples
- `[[1,2]]` → `[-1]`: no interval starts at or after 2.
- `[[3,4],[2,3],[1,2]]` → `[-1, 0, 1]`: `[2,3]` ends at 3 and `[3,4]` starts at 3 (index 0).
  `[1,2]` ends at 2 and `[2,3]` starts at 2 (index 1).
- `[[1,4],[2,3],[3,4]]` → `[-1, 2, -1]`.

## Constraints
- `1 <= len(intervals) <= 2·10^4`, `-10^6 <= start_i <= end_i <= 10^6`.
- All starts are distinct.
- n up to 2·10^4 means the O(n²) "check every pair" is too slow. Aim for O(n log n).

## Pattern & how to recognise it
- "For each interval, the **smallest start ≥ its end**" is a question about a **boundary**
  between starts that are too small and starts that qualify. Two heaps keep that boundary: a
  max-heap of starts and a max-heap of ends, processed from the largest end down.
- The answer is an **index**, so every heap entry carries its original index.
- Sorting the starts and binary searching for each end is an equally good alternative.
- Lesson: [Two Heaps](../../learn/two-heaps/01-intro.md) (see "the smallest start ≥ an end" in the
  variants).

## Learning material
- A heap gives O(1) access to its top and O(log n) push/pop. With Python's `heapq` (a min-heap),
  store `(-value, index)` for a max-heap.
- Processing queries in **sorted order** (here: ends from largest to smallest) lets one pointer or
  heap move monotonically, so every element is popped at most once.
- [Python heapq docs](https://docs.python.org/3/library/heapq.html).

## Hints
<details><summary>Hint 1</summary>

If you handle the intervals by **end**, from the largest end to the smallest, which starts can
you safely throw away as you go?
</details>
<details><summary>Hint 2</summary>

For the current end, pop starts from a max-heap while they are still ≥ the end. The last one you
popped is the smallest such start. Does a smaller end later still need it?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Max-heap `starts` of `(start, i)`, max-heap `ends` of `(end, i)`. While `ends` is not empty:
pop the largest end `(e, i)`. Pop from `starts` while its top start is ≥ `e`, remembering the
last popped `(s, j)`. If there is one, `answer[i] = j` and push `(s, j)` back, since smaller
ends may need it too. Otherwise `answer[i] = -1`.

Alternative: sort the `(start, index)` pairs and use `bisect_left` on the starts for each end.

Time O(n log n), space O(n).
</details>

## Follow-ups
- Return the right interval itself instead of its index.
- Starts are not unique: return the smallest index among equal starts.
- Online version: intervals arrive one by one and queries ask for the current right interval
  (use a balanced BST or a sorted container).
