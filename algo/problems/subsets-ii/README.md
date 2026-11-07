# Subsets II

> Difficulty: **medium** · Patterns: subsets, backtracking · Sources: [leetcode](https://leetcode.com/problems/subsets-ii/)

## Problem
Given an integer array `nums` that **may contain duplicates**, return every possible subset.
The answer must not contain duplicate subsets: `[1,2]` and `[2,1]` built from the same values
count as the same subset. Return the subsets in any order.

## Examples
- `nums = [1,2,2]` → `[[],[1],[1,2],[1,2,2],[2],[2,2]]`
- `nums = [0]` → `[[],[0]]`
- `nums = [4,4,4]` → `[[],[4],[4,4],[4,4,4]]`: only the *count* of 4s matters.

## Constraints
- `1 <= len(nums) <= 10`, `-10 <= nums[i] <= 10`.

## Pattern & how to recognise it
- "All subsets" → **Subsets** (BFS from the empty set).
- "May contain duplicates … no duplicate subsets" → **sort first**, then treat a repeated value
  specially so the same subset is never built twice. Generating everything and de-duplicating
  with a set works but wastes time and memory.
- Lesson: [Subsets — variants](../../learn/subsets/02-variants.md).

## Learning material
- After sorting, equal values sit next to each other. When the current number equals the
  previous one, extending **every** existing subset would recreate subsets you already made in
  the previous step. Extend only the subsets **added in the previous step**.
- [LeetCode 90](https://leetcode.com/problems/subsets-ii/).

## Hints
<details><summary>Hint 1</summary>

Sort `nums`. Then work through `[1, 2, 2]` by hand with the plain subsets algorithm and circle
the duplicates. Which subsets did the second `2` extend that it shouldn't have?
</details>
<details><summary>Hint 2</summary>

Remember where the previous step's new subsets started in the result list.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Sort. `result = [[]]`, `start = 0`. For each index `i`: `end = len(result)`. If
`i > 0 and nums[i] == nums[i-1]`, keep `start` at the previous step's `end` (only extend last
step's subsets), otherwise `start = 0`. Append `result[j] + [nums[i]]` for `j` in
`[start, end)`, then set `start = end`. Time O(n · 2^n), space O(n · 2^n).
</details>

## Follow-ups
- Combination Sum II (LeetCode 40): same "skip equal neighbours" trick inside backtracking.
- Permutations II (LeetCode 47): duplicates in permutations.
