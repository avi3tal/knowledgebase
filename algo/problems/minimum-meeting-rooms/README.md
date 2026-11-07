# Minimum Meeting Rooms

> Difficulty: **medium** · Patterns: merge-intervals, heap · Sources: [leetcode](https://leetcode.com/problems/meeting-rooms-ii/)

## Problem
Given an array of meeting time intervals `intervals[i] = [start_i, end_i]`, return the minimum
number of conference rooms needed to hold all meetings. A room freed at time `t` can host a
meeting that starts at `t`.

## Examples
- `intervals = [[0,30],[5,10],[15,20]]` → `2` (`[0,30]` needs its own room and the other two share)
- `intervals = [[7,10],[2,4]]` → `1`
- `intervals = [[1,10],[2,9],[3,8],[4,7]]` → `4` (all four overlap at time 4)

## Constraints
- `1 <= len(intervals) <= 10^4`
- `0 <= start_i < end_i <= 10^6`

## Pattern & how to recognise it
- "**How many** overlap at once?" over `[start, end]` pairs → **Merge Intervals** with a
  **min-heap of end times**. The answer is the peak number of meetings in progress.
- Merging would hide the count (two overlapping meetings become one interval), so you have to
  track the running set.
- Lesson: [Merge Intervals — variants](../../learn/merge-intervals/02-variants.md).

## Learning material
- Process meetings by start time. The rooms in use are the meetings that haven't ended yet.
  The one that frees up first is the one with the **smallest end**, which is what a min-heap
  gives you in O(log n).
- Alternative: a sweep line over `+1` (start) and `−1` (end) events, with ends before starts
  on ties.
- [Python heapq](https://docs.python.org/3/library/heapq.html), Go
  [container/heap](https://pkg.go.dev/container/heap).

## Hints
<details><summary>Hint 1</summary>

At the moment a meeting starts, how many rooms are busy? Which meetings are they?
</details>
<details><summary>Hint 2</summary>

You only ever need the busy meeting that ends **earliest**. Which data structure gives you that
quickly?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sort by start. Keep a min-heap of end times. For each meeting, pop while `heap[0] <= start`,
then push its end. The answer is the largest heap size seen (or simply the final size, if you pop
at most one per meeting and reuse that room). Time O(n log n), space O(n).
</details>

## Follow-ups
- Also return which room each meeting goes to.
- Maximum CPU load, where each job also has a load: track the sum of the heap's loads.
