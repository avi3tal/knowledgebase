# Pair With Target Sum (exists?)

> Difficulty: **easy** · Patterns: hashmap, two-pointers · Sources: classic interview question

## Problem
Given an **unsorted** array of integers `nums` and an integer `target`, return `true` if two
elements at **different positions** add up to `target`, otherwise `false`.
This is the yes/no variant of [Two Sum](../two-sum/README.md): you don't return indices.

## Examples
- `nums = [1, 2, 3, 9], target = 11` → `true` (2 + 9)
- `nums = [1, 2, 4, 9], target = 8` → `false` (4 would need a second 4)
- `nums = [1, 2, 3, 4, 4, 9], target = 8` → `true` (the two 4s are different elements)

## Constraints
- `0 <= len(nums) <= 10^5`, `-10^9 <= nums[i], target <= 10^9`
- n up to 10^5 rules out the O(n²) "try every pair" loop; aim for O(n).

## Pattern & how to recognise it
- **"Do two elements combine to X?"** → for each `x`, ask whether its complement `target - x`
  was already seen. A **hash set** of seen values answers in O(1).
- If the input were **sorted**, **two pointers** from both ends need no extra memory: too small →
  move left pointer right, too big → move right pointer left.
- See [algo/notes/patterns.md](../../notes/patterns.md) (HashMaps).

## Learning material
- **Hash set:** average O(1) `add` and `in`. Store the values seen so far; checking the complement
  *before* adding the current value prevents pairing an element with itself.
- **What exactly do you store?** Either store the *values* and look up `target - x`, or store the
  *complements* `target - x` and look up `x`. Mixing the two (store complements, look up
  complements) silently turns the algorithm into "does any value repeat?".
- **Two pointers on sorted input:** each comparison discards one candidate, so O(n) after an
  O(n log n) sort.
- NeetCode Two Sum walkthrough: https://neetcode.io/problems/two-integer-sum

## Hints
<details><summary>Hint 1</summary>

For a fixed `x`, which single value would complete the pair?
</details>
<details><summary>Hint 2</summary>

Remember the values you have already passed in a structure with O(1) membership tests.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`seen = set()`. For each `x`: if `target - x in seen` return `true`; otherwise `seen.add(x)`.
Return `false` at the end. Time O(n), space O(n).
Sorted variant: two pointers, O(n) time, O(1) space.
</details>

## Follow-ups
- Return the indices → [Two Sum](../two-sum/README.md).
- The input is sorted → two pointers, O(1) space.
- The list does not fit in memory: sort externally and run two pointers over the two ends of the
  file, or hash-partition values into buckets so that `x` and `target - x` land in paired buckets,
  then solve bucket pairs one at a time.
- A stream of numbers with `add` / `find` operations (LeetCode 170, Two Sum III).
