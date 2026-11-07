# Contiguous Array

> Difficulty: **medium** · Patterns: prefix-sum, hashmap · Sources: [leetcode](https://leetcode.com/problems/contiguous-array/)

## Problem
Given a binary array `nums` (only 0s and 1s), return the length of the longest **contiguous**
subarray that contains the same number of 0s and 1s. Return 0 if there is none.

## Examples
- `nums = [0, 1]` → `2`.
- `nums = [0, 1, 0]` → `2`: `[0,1]` or `[1,0]`.
- `nums = [0, 0, 1, 0, 0, 0, 1, 1]` → `6`: `[1,0,0,0,1,1]` at positions 2–7.

## Constraints
- `1 <= nums.length <= 10^5`, each value is 0 or 1.
- O(n²) over all subarrays is too slow. Aim for O(n).

## Pattern & how to recognise it
- "Equal number of 0s and 1s" becomes "sum equals 0" if you count each 0 as **−1**.
- **Longest** subarray with sum 0 → prefix sums + a hash map from each prefix value to the
  **first** index where it appeared. Two equal prefix sums enclose a zero-sum subarray.
- A sliding window doesn't work: there is no monotone "too big / too small" condition to shrink on.
- Lesson: [Prefix Sum](../../learn/prefix-sum/01-intro.md).

## Learning material
- If `P[i] == P[j]`, then `nums[i..j−1]` sums to 0. To make that subarray as long as possible,
  pair each `j` with the **earliest** `i` that has the same prefix value.
- Seed the map with `{0: -1}` (the empty prefix sits just before index 0).
- [Prefix sum (Wikipedia)](https://en.wikipedia.org/wiki/Prefix_sum)

## Hints
<details><summary>Hint 1</summary>

Turn the condition "#0 == #1" into a condition about a sum.
</details>
<details><summary>Hint 2</summary>

When the running balance returns to a value it had before, what do you know about the elements
in between? Which earlier occurrence gives the longest stretch?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`first = {0: -1}`, `balance = 0`, `best = 0`. For each index `i`: `balance += 1 if nums[i] else -1`;
if `balance` is in `first`, `best = max(best, i − first[balance])`, otherwise
`first[balance] = i`. Never overwrite an existing entry: the earliest index is what you want.

Expected complexity: time O(n), space O(n).

</details>

## Follow-ups
- Count (instead of measure) the balanced subarrays.
- Three symbols with equal counts: key the map by the pair of differences.
- Longest subarray with sum exactly k in an array with negatives.
