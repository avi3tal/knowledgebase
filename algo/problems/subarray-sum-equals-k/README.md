# Subarray Sum Equals K

> Difficulty: **medium** · Patterns: prefix-sum, hashmap · Sources: [leetcode](https://leetcode.com/problems/subarray-sum-equals-k/)

## Problem
Given an integer array `nums` (values may be **negative**) and an integer `k`, return how many
non-empty **contiguous** subarrays have a sum of exactly `k`.

## Examples
- `nums = [1, 1, 1], k = 2` → `2`: `[1,1]` at positions 0–1 and 1–2.
- `nums = [1, 2, 3], k = 3` → `2`: `[1,2]` and `[3]`.
- `nums = [1, -1, 0], k = 0` → `3`: `[1,-1]`, `[0]` and `[1,-1,0]`.

## Constraints
- `1 <= nums.length <= 2 * 10^4`, `-1000 <= nums[i] <= 1000`, `-10^7 <= k <= 10^7`.
- Checking all O(n²) subarrays is too slow at the top of the range. Target O(n).

## Pattern & how to recognise it
- **Count** contiguous subarrays with an **exact sum**, and the values can be negative →
  **prefix sums + a hash map** of how often each prefix sum has occurred.
- Why not a sliding window: with negatives, extending the window can *lower* the sum, so
  "shrink while the sum is too big" is no longer valid.
- Lesson: [Prefix Sum](../../learn/prefix-sum/01-intro.md).

## Learning material
- `sum(nums[i..j]) = P[j+1] − P[i]`. A subarray ending at `j` sums to `k` exactly when some
  earlier prefix equals `P[j+1] − k`.
- Scan once, keep `count[prefix]` for the prefixes seen so far, and seed it with `{0: 1}` (the
  empty prefix, so subarrays that start at index 0 count).
- [Prefix sum (Wikipedia)](https://en.wikipedia.org/wiki/Prefix_sum)

## Hints
<details><summary>Hint 1</summary>

Write the sum of `nums[i..j]` as the difference of two prefix sums.
</details>
<details><summary>Hint 2</summary>

At position `j`, how many starting points `i` make that difference equal to `k`? What would you
need to have stored to answer that in O(1)?
</details>
<details><summary>Hint 3</summary>

How do you count subarrays that start at index 0?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`seen = {0: 1}`, `prefix = 0`, `count = 0`. For each `x`: `prefix += x`;
`count += seen.get(prefix − k, 0)`; then `seen[prefix] += 1`. The order matters: look up before
you insert, so the empty subarray isn't counted when `k == 0`.

Expected complexity: time O(n), space O(n).

</details>

## Follow-ups
- Longest subarray with sum k: store the **first** index of each prefix instead of a count.
- Count subarrays whose sum is divisible by k (key the map by `prefix mod k`).
- All values positive: a sliding window does it in O(1) space.
