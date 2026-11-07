# Meeting Rooms

> Difficulty: **easy** · Patterns: merge-intervals · Sources: [leetcode](https://leetcode.com/problems/meeting-rooms/)

## Problem
Given an array of meeting time intervals `intervals[i] = [start_i, end_i]`, return `true` if one
person can attend **all** of them, which means no two meetings overlap. A meeting that ends at
time `t` doesn't conflict with one that starts at `t`.

## Examples
- `intervals = [[0,30],[5,10],[15,20]]` → `false` (`[5,10]` falls inside `[0,30]`)
- `intervals = [[7,10],[2,4]]` → `true`
- `intervals = [[1,3],[3,6]]` → `true` (back to back is fine)

## Constraints
- `0 <= len(intervals) <= 10^4`
- `0 <= start_i < end_i <= 10^6`
- The input is **not** sorted.

## Pattern & how to recognise it
- A list of `[start, end]` pairs plus the question "does anything **overlap**?" → **Merge
  Intervals**, conflict-check variant.
- Comparing every pair is O(n²). After sorting by start, only **neighbours** can conflict.
- Lesson: [Merge Intervals](../../learn/merge-intervals/01-intro.md).

## Learning material
- Two intervals `a`, `b` with `a.start <= b.start` overlap exactly when `b.start < a.end` (here
  touching ends are allowed, so the comparison is strict).
- Sorting costs O(n log n) and dominates. The scan after it is O(n).
- [Interval scheduling (Wikipedia)](https://en.wikipedia.org/wiki/Interval_scheduling)

## Hints
<details><summary>Hint 1</summary>

If the meetings were listed in time order, which meetings could a given meeting possibly clash
with?
</details>
<details><summary>Hint 2</summary>

After sorting by start, it's enough to compare each meeting with the one right before it.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sort by start. For `k` from 1: if `intervals[k].start < intervals[k-1].end`, return `false`.
Return `true`. Time O(n log n), space O(1) beyond the sort.
</details>

## Follow-ups
- How many rooms are needed? → [Minimum Meeting Rooms](../minimum-meeting-rooms/README.md).
- Return the conflicting pairs instead of a boolean.
