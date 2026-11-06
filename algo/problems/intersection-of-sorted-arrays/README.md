# Intersection of Two Sorted Arrays

> Difficulty: **easy** · Patterns: two-pointers · Sources: [interviewbit](https://www.interviewbit.com/problems/intersection-of-sorted-arrays/)

## Problem
Given two **sorted** integer arrays `a` and `b`, return the sorted list of elements that occur in
both. A value that appears `x` times in `a` and `y` times in `b` appears `min(x, y)` times.

## Examples
- `a = [1, 2, 3, 3, 4, 5, 6], b = [3, 3, 5]` → `[3, 3, 5]`
- `a = [1, 2, 3, 3, 4, 5, 6], b = [3, 5]` → `[3, 5]`
- `a = [1, 2], b = [3, 4]` → `[]`

## Constraints
- `0 <= len(a), len(b) <= 10^6`, both sorted ascending.
- Target O(n + m) time and O(1) extra space besides the output.

## Pattern & how to recognise it
- **Two sorted sequences walked together → two pointers.** Compare heads; advance the smaller one;
  on equality, emit and advance both.
- Without sorting you'd use a hashmap of counts (O(n + m) time, O(min(n, m)) space).

## Learning material
- Each step advances at least one pointer, so at most `n + m` steps.
- Duplicates take care of themselves: advancing **both** pointers on a match consumes one copy
  from each side, which yields the `min(x, y)` multiplicity.
- If one array is much smaller (`m << n`), binary-searching each of its elements in the big one
  costs O(m log n), which beats O(n + m).
- LeetCode 350 (unsorted version): https://leetcode.com/problems/intersection-of-two-arrays-ii/

## Hints
<details><summary>Hint 1</summary>

Look at the first element of each array. If they differ, which one can never be in the answer?
</details>
<details><summary>Hint 2</summary>

On a match, how many copies have you just accounted for, and which pointers move?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`i = j = 0`; while both in range: `a[i] < b[j]` → `i += 1`; `a[i] > b[j]` → `j += 1`;
else append and advance both. Time O(n + m), space O(1) extra.
</details>

## Follow-ups
- Distinct values only (LeetCode 349).
- Unsorted input → hashmap of counts (LeetCode 350); one array on disk → stream it against a
  hash of the smaller one.
- Union of two sorted arrays → [Merge Two Sorted Arrays](../merge-two-sorted-arrays/README.md).
