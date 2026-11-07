# Longest Increasing Subsequence

> Difficulty: **medium** · Patterns: longest-common-substring, dp-1d · Sources: [leetcode](https://leetcode.com/problems/longest-increasing-subsequence/)

## Problem
Given an integer array `nums`, return the length of the longest **strictly increasing
subsequence**. A subsequence keeps the original order but may skip elements.

## Examples
- `nums = [10, 9, 2, 5, 3, 7, 101, 18]` → `4`, e.g. `[2, 3, 7, 101]`.
- `nums = [0, 1, 0, 3, 2, 3]` → `4`: `[0, 1, 2, 3]`.
- `nums = [7, 7, 7, 7]` → `1`. Equal values don't count as increasing.

## Constraints
- `1 <= len(nums) <= 2500`, `-10^4 <= nums[i] <= 10^4`.
- O(n²) passes. The follow-up asks for O(n log n).

## Pattern & how to recognise it
- "Longest ... **subsequence**" over one array, where each element can follow some earlier
  ones → the **Longest Common Substring** family, run on one sequence against itself. The
  state is "the best subsequence **ending at index i**".
- Trying every subsequence is 2ⁿ. The DP reuses the answers for earlier indices.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/02-variants.md).

## Learning material
- **"Ending here" states:** when the answer can end anywhere, define `best[i]` as the best answer
  that *ends exactly at* `i`, then take the max over all `i`. It's the same trick as the
  substring variant of the 2-D table.
- **Patience sorting** (for the O(n log n) follow-up): keep, for every length L, the smallest
  possible tail of an increasing subsequence of length L. That list is sorted, so binary search
  finds where each new number goes.
- [LIS on cp-algorithms](https://cp-algorithms.com/sequences/longest_increasing_subsequence.html)

## Hints
<details><summary>Hint 1</summary>

If the longest increasing subsequence ends at `nums[i]`, what is the element just before it?
</details>
<details><summary>Hint 2</summary>

`best[i] = 1 + max(best[j])` over earlier `j` that are allowed to come before `i`. Is
`best[n-1]` the answer?
</details>
<details><summary>Hint 3</summary>

For O(n log n): for each length, would you rather the subsequence end in a small or a large
number?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

O(n²): `best[i] = 1 + max(best[j] for j < i if nums[j] < nums[i])` (or 1), answer
`max(best)`. O(n log n): keep `tails`. For each `x`, binary-search the first tail ≥ `x` and
replace it, or append `x` if every tail is smaller. Answer `len(tails)`.

Expected complexity: time O(n log n), space O(n).

</details>

## Follow-ups
- Return the subsequence itself (keep parent pointers).
- Number of longest increasing subsequences (LeetCode 673).
- Russian Doll Envelopes (LeetCode 354): 2-D LIS after sorting.
- Maximum-sum increasing subsequence (this repo).
