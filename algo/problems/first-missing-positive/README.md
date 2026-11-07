# First Missing Positive

> Difficulty: **hard** · Patterns: cyclic-sort · Sources: [leetcode](https://leetcode.com/problems/first-missing-positive/)

## Problem
Given an unsorted integer array `nums`, return the **smallest positive integer** that does not
appear in it. You must use O(n) time and O(1) auxiliary space.

## Examples
- `nums = [1,2,0]` → `3`
- `nums = [3,4,-1,1]` → `2`
- `nums = [7,8,9,11,12]` → `1`

## Constraints
- `1 <= len(nums) <= 10^5`
- `-2^31 <= nums[i] <= 2^31 − 1`

## Pattern & how to recognise it
- The answer is always in `1..n+1`. With `n` slots, only values `1..n` can matter. That's a range
  tied to the length → **Cyclic Sort**, skipping everything outside `1..n`.
- Sorting is O(n log n) and a set is O(n) space. The constraints rule both out.
- Lesson: [Cyclic Sort — variants](../../learn/cyclic-sort/02-variants.md).

## Learning material
- Swap only values with a home (`1 <= v <= n`) to index `v − 1`. Zeros, negatives, values
  `> n` and duplicates are left where they are. They fill the slots of missing values.
- The first index `k` with `nums[k] != k + 1` gives the answer `k + 1`. If every slot is
  correct, the answer is `n + 1`.

## Hints
<details><summary>Hint 1</summary>

What's the largest possible answer for an array of length `n`?
</details>
<details><summary>Hint 2</summary>

So only values in `1..n` are interesting. Can each of them be stored at a position determined
by its value?
</details>
<details><summary>Hint 3</summary>

Watch out for duplicates when swapping, or the loop never ends.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`i = 0`. While `i < n`: `j = nums[i] − 1`. If `0 <= j < n` and `nums[i] != nums[j]`, swap;
else `i += 1`. Then return the first `k + 1` with `nums[k] != k + 1`, or `n + 1`. Time O(n),
space O(1).
</details>

## Follow-ups
- Return the first `k` missing positive numbers.
- Without modifying the array: there's no O(n)/O(1) solution. Discuss the trade-offs.
