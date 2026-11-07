# Find All Missing Numbers

> Difficulty: **easy** · Patterns: cyclic-sort · Sources: [leetcode](https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/)

## Problem
Given an array `nums` of `n` integers where each `nums[i]` is in the range `1..n`, return all
the integers in `1..n` that do **not** appear in `nums`. Some values may appear more than once.
Return them in any order.

## Examples
- `nums = [4,3,2,7,8,2,3,1]` → `[5,6]`
- `nums = [1,1]` → `[2]`
- `nums = [2,3,1,5,4]` → `[]`

## Constraints
- `1 <= n <= 10^5`, `1 <= nums[i] <= n`
- Target: O(n) time and no extra space besides the returned list.

## Pattern & how to recognise it
- Values in `1..n` + "**all** missing" + no extra space → **Cyclic Sort**, then a scan.
- A boolean array or set is the O(n)-space version. XOR can't separate several unknowns.
- Lesson: [Cyclic Sort](../../learn/cyclic-sort/01-intro.md).

## Learning material
- Value `v` belongs at index `v − 1`. Swap values home until each slot holds its own value or a
  duplicate that has nowhere to go.
- Afterwards, every index `k` with `nums[k] != k + 1` means `k + 1` is missing.
- Alternative in-place marking: negate `nums[|v| − 1]` for every `v`. The indices that stay
  positive are the missing values.

## Hints
<details><summary>Hint 1</summary>

The values are valid indices (after subtracting 1). Can the array record which values it has
seen?
</details>
<details><summary>Hint 2</summary>

Put each value at index `value − 1`. What do the slots that can't be filled correctly tell you?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Cyclic sort: `i = 0`. While `i < n`: `j = nums[i] − 1`. If `nums[i] != nums[j]`, swap;
else `i += 1`. Then collect `k + 1` for every `k` with `nums[k] != k + 1`. Time O(n), space
O(1) extra.
</details>

## Follow-ups
- Return the duplicates instead → [Find All Duplicates](../find-all-duplicates/README.md).
- Find the first k missing positive numbers (values may be outside `1..n`).
