# Merge Intervals

> Difficulty: **medium** · Patterns: merge-intervals · Sources: [leetcode](https://leetcode.com/problems/merge-intervals/)

## Problem
Given an array of intervals `intervals[i] = [start_i, end_i]`, merge all overlapping intervals
and return the non-overlapping intervals that cover exactly the same points. Intervals that
**touch** (`[1,4]` and `[4,5]`) overlap. The output may be in any order.

## Examples
- `intervals = [[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`
- `intervals = [[1,4],[4,5]]` → `[[1,5]]`
- `intervals = [[1,10],[2,3],[4,5]]` → `[[1,10]]` (the small ones are inside the big one)

## Constraints
- `1 <= len(intervals) <= 10^4`
- `0 <= start_i <= end_i <= 10^4`
- The input is **not** sorted.

## Pattern & how to recognise it
- `[start, end]` pairs + "**merge** overlapping" → **Merge Intervals**, the core template.
- Pairwise comparison is O(n²) and misses chains (`[1,3]`, `[2,5]`, `[4,8]` all merge, though
  the first and last don't overlap directly).
- Lesson: [Merge Intervals](../../learn/merge-intervals/01-intro.md).

## Learning material
- Once intervals are sorted by start, an interval can only overlap the **last merged** one.
- Overlap test for `a.start <= b.start`: `b.start <= a.end`. The merged end is
  `max(a.end, b.end)`, because `b` may be contained in `a`.
- Sorting O(n log n), plus one O(n) sweep.

## Hints
<details><summary>Hint 1</summary>

Sort first. By which field?
</details>
<details><summary>Hint 2</summary>

Keep an output list. Each new interval either extends the output's last interval or starts a new
one.
</details>
<details><summary>Hint 3</summary>

When extending, why is `max` needed for the end?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sort by start. For each `[s, e]`: if the output is non-empty and `s <= out[-1].end`, set
`out[-1].end = max(out[-1].end, e)`; otherwise append `[s, e]`. Time O(n log n), space O(n) for
the output (plus the sort).
</details>

## Follow-ups
- Insert one interval into an already sorted, disjoint list in O(n) (LeetCode 57).
- Intervals arrive as a stream: keep them merged with a sorted structure (LeetCode 352).
