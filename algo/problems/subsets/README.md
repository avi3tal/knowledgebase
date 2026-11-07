# Subsets

> Difficulty: **medium** · Patterns: subsets, backtracking · Sources: [leetcode](https://leetcode.com/problems/subsets/)

## Problem
Given an array `nums` of **distinct** integers, return every possible subset (the power set).
The answer must not contain duplicate subsets. Subsets may be returned in any order, and the
numbers inside a subset may be in any order.

## Examples
- `nums = [1,2,3]` → `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]`
- `nums = [0]` → `[[],[0]]`
- `nums = []` → `[[]]` (the empty set has exactly one subset: itself)

## Constraints
- `0 <= len(nums) <= 10`, `-10 <= nums[i] <= 10`, all values distinct.
- There are `2^n` subsets, so the output alone is O(n · 2^n). No algorithm can beat that.

## Pattern & how to recognise it
- "Return **all subsets** / all combinations" of a small set → **Subsets** (BFS from the empty
  set). Every element is an independent take-it-or-leave-it choice, so the answer doubles with
  each element.
- The tiny `n` (≤ 10) confirms that exponential output is expected.
- Lesson: [Subsets](../../learn/subsets/01-intro.md).

## Learning material
- Start with `[[]]`. For each number, copy every subset you already have and append the number
  to the copy. After processing `k` numbers you hold all `2^k` subsets of the first `k`.
- Equivalent views: a binary counter (bit `j` of a mask says whether `nums[j]` is in), or a
  recursion that branches "skip / take" on each element.
- [LeetCode 78 discussion of the iterative, recursive and bitmask approaches](https://leetcode.com/problems/subsets/editorial/).

## Hints
<details><summary>Hint 1</summary>

If you already had every subset of `[1, 2]`, how would you get every subset of `[1, 2, 3]`?
</details>
<details><summary>Hint 2</summary>

Each subset of `[1, 2, 3]` either lacks `3` (an old subset) or is an old subset plus `3`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`result = [[]]`. For each `num`: for every subset `s` currently in `result` (iterate over a
frozen count, not the growing list), append `s + [num]`. Return `result`.
Time O(n · 2^n), space O(n · 2^n) for the output.
</details>

## Follow-ups
- Input with duplicates: Subsets II (`subsets-ii`).
- Only subsets of size `k` (LeetCode 77, Combinations).
- Generate them lazily (an iterator) or with a bitmask loop instead of copying lists.
