# Product of Array Except Self

> Difficulty: **medium** · Patterns: arrays-hashing, prefix-sum · Sources: [educative](https://www.educative.io/courses/data-structures-coding-interviews-python), [leetcode](https://leetcode.com/problems/product-of-array-except-self/)

## Problem
Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all
elements except `nums[i]`. **Don't use division**, and run in O(n).

## Examples
- `nums = [1, 2, 3, 4]` → `[24, 12, 8, 6]`
- `nums = [4, 2, 1, 5, 0]` → `[0, 0, 0, 0, 40]`
- `nums = [-1, 2, -3, 4]` → `[-24, 12, -8, 6]`

## Constraints
- `2 <= len(nums) <= 10^5`, `-30 <= nums[i] <= 30`, every product fits in 32 bits.
- No division (zeros would break it anyway). O(n) time; follow-up: O(1) extra space besides the
  output.

## Pattern & how to recognise it
- **"Everything except i"** → split into **everything left of i** × **everything right of i**:
  prefix products and suffix products, the multiplicative cousin of prefix sums.
- Recomputing the right-hand product for every `i` is O(n²).

## Learning material
- `prefix[i] = nums[0] * … * nums[i-1]`, `suffix[i] = nums[i+1] * … * nums[n-1]`,
  `answer[i] = prefix[i] * suffix[i]`.
- O(1) extra space: write prefixes into `answer` in a left-to-right pass, then sweep right-to-left
  with a running suffix product multiplied in.
- LeetCode editorial: https://leetcode.com/problems/product-of-array-except-self/editorial/

## Hints
<details><summary>Hint 1</summary>

`answer[i]` = (product of everything to the left) × (product of everything to the right).
</details>
<details><summary>Hint 2</summary>

Both of those can be built incrementally in one pass each.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`answer[0] = 1`; left to right: `answer[i] = answer[i-1] * nums[i-1]`. Then `r = 1`; right to
left: `answer[i] *= r; r *= nums[i]`. Time O(n), space O(1) extra.
</details>

## Follow-ups
- Allowed to divide: handle zero count 0 / 1 / ≥2 separately.
- Sum / product of a range queried many times → prefix arrays (LeetCode 303).
