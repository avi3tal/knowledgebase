# Interval List Intersections

> Difficulty: **medium** · Patterns: merge-intervals, two-pointers · Sources: [leetcode](https://leetcode.com/problems/interval-list-intersections/)

## Problem
You're given two lists of closed intervals, `firstList` and `secondList`. Each list is **sorted**
by start and its intervals are pairwise **disjoint**. Return the intersection of the two lists:
every interval of points that lies in both, in sorted order. Intervals that touch at one point
intersect in a single point, like `[5,5]`.

## Examples
- `firstList = [[0,2],[5,10],[13,23],[24,25]]`, `secondList = [[1,5],[8,12],[15,24],[25,26]]` →
  `[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]`
- `firstList = [[1,3],[5,9]]`, `secondList = []` → `[]`

## Constraints
- `0 <= len(firstList), len(secondList) <= 1000`
- `0 <= start_i <= end_i <= 10^9`, `end_i < start_{i+1}` within each list.

## Pattern & how to recognise it
- Ranges + "**intersection**" + **two sorted** lists → **Merge Intervals** (intersect variant)
  with a **two-pointer** walk. Comparing all pairs is O(n·m).
- Lesson: [Merge Intervals — variants](../../learn/merge-intervals/02-variants.md).

## Learning material
- The intersection of `[a1, a2]` and `[b1, b2]` is `[max(a1, b1), min(a2, b2)]`. It's
  non-empty when that start is `<=` that end.
- The interval that **ends first** can't overlap anything later in the other list, so drop it.
- O(n + m) time, because each step advances one pointer.

## Hints
<details><summary>Hint 1</summary>

Write a helper that intersects just two intervals. When is the result empty?
</details>
<details><summary>Hint 2</summary>

Use one pointer per list. After comparing `firstList[i]` and `secondList[j]`, which one can you
safely discard?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`i = j = 0`. While both are in range: `lo = max(starts)`, `hi = min(ends)`. If `lo <= hi`, append
`[lo, hi]`. Advance `i` if `firstList[i]` ends first, else `j`. Time O(n + m), space O(n + m)
for the output.
</details>

## Follow-ups
- Union of the two lists instead of the intersection.
- Free time common to k people's calendars (Employee Free Time, LeetCode 759): a heap of list
  heads.
