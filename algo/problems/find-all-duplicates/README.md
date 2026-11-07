# Find All Duplicates in an Array

> Difficulty: **medium** · Patterns: cyclic-sort · Sources: [leetcode](https://leetcode.com/problems/find-all-duplicates-in-an-array/)

## Problem
Given an integer array `nums` of length `n` where every value is in `1..n` and each value
appears **once or twice**, return every value that appears twice, in any order.

## Examples
- `nums = [4,3,2,7,8,2,3,1]` → `[2,3]`
- `nums = [1,1,2]` → `[1]`
- `nums = [1]` → `[]`

## Constraints
- `1 <= n <= 10^5`, `1 <= nums[i] <= n`, each value appears at most twice.
- Target: O(n) time and O(1) extra space (the output doesn't count).

## Pattern & how to recognise it
- Values in `1..n`, **all** duplicates, mutation allowed, O(1) space → **Cyclic Sort**. After
  placing every value at index `v − 1`, the extra copies are parked in foreign slots.
- If the array were read-only and you needed just one duplicate, it would be Fast & Slow
  Pointers instead ([Find the Duplicate Number](../find-the-duplicate-number/README.md)).
- Lesson: [Cyclic Sort](../../learn/cyclic-sort/01-intro.md).

## Learning material
- Swap `nums[i]` home while its home holds a different value. When the home already holds an
  equal value, that's a duplicate, so leave it and move on.
- After the pass, `nums[k] != k + 1` means `nums[k]` is an extra copy.
- In-place marking alternative: for each `v`, look at `nums[|v| − 1]`. If it's already
  negative, `|v|` is a duplicate. Otherwise negate it.

## Hints
<details><summary>Hint 1</summary>

Where does value `v` belong if the array were sorted and complete?
</details>
<details><summary>Hint 2</summary>

When you try to send a value home and an identical value is already there, what have you
found?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Cyclic sort (`i` stays while swapping, compare values not indices to avoid infinite loops), then
collect `nums[k]` for every `k` with `nums[k] != k + 1`. Each such slot holds a distinct
duplicate. Time O(n), space O(1) extra.
</details>

## Follow-ups
- Find the duplicate **and** the missing value at once (Set Mismatch, LeetCode 645).
- Read-only array, one duplicate → Floyd's cycle detection.
