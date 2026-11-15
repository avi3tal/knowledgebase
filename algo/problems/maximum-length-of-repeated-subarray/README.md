# Maximum Length of Repeated Subarray

> Difficulty: **medium** · Patterns: longest-common-substring, dp-2d · Sources: [leetcode](https://leetcode.com/problems/maximum-length-of-repeated-subarray/)

## Problem
Given two integer arrays `nums1` and `nums2`, return the length of the longest **contiguous**
subarray that appears in both.

## Examples
- `nums1 = [1,2,3,2,1]`, `nums2 = [3,2,1,4,7]` → `3`. The subarray `[3,2,1]` appears in both.
- `nums1 = [0,0,0,0,0]`, `nums2 = [0,0,0,0,0]` → `5`.
- `nums1 = [1,2,3,4,5]`, `nums2 = [1,9,2,3,4,9,5]` → `3` (`[2,3,4]`). The longer common
  *subsequence* `[1,2,3,4,5]` doesn't count, because it isn't contiguous in `nums2`.

## Constraints
- `1 <= len(nums1), len(nums2) <= 1000`, values may be negative.
- That is about 10^6 index pairs, so an O(n·m) table fits. Comparing every pair of starting points
  and extending each match is O(n·m·min(n, m)), which is too slow.

## Pattern & how to recognise it
- This is Longest Common Substring with **arrays instead of strings**. Two sequences and "longest
  common *contiguous* part" are the signal for a 2-D DP indexed by the end positions `(i, j)`.
- Lesson: [Longest Common Substring](../../learn/longest-common-substring/01-intro.md). The string
  version is [Longest Common Substring](../longest-common-substring/README.md).

## Learning material
- `dp[i][j]` = length of the common run that ends at `nums1[i-1]` and `nums2[j-1]`. If the elements
  match, `dp[i][j] = dp[i-1][j-1] + 1`; otherwise it is `0`. The answer is the maximum over all cells.
- A padding row and column of zeros remove the bounds checks.
- **Space:** each cell only needs the previous row's diagonal neighbour. Iterating `j` from right to
  left over a single row gives O(m) space.
- For very long arrays, binary search on the length with a rolling hash runs in O((n+m) log(min)).
- Reading: [LeetCode 718 editorial](https://leetcode.com/problems/maximum-length-of-repeated-subarray/editorial/).

## Hints
<details><summary>Hint 1</summary>

Fix where the common subarray *ends* in each array. How long can it be, given the answer for one
step earlier in both arrays?
</details>
<details><summary>Hint 2</summary>

What happens to that length when the two current elements differ?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Keep one row `dp` of size `m + 1`. For each `i`, iterate `j` from `m` down to 1:
- if `nums1[i-1] == nums2[j-1]`, set `dp[j] = dp[j-1] + 1`;
- otherwise set `dp[j] = 0`.

Track the maximum and return it.

Expected complexity: time O(n·m) (O(n^2) when the lengths are equal), space O(m).
</details>

## Follow-ups
- Return the subarray itself, not just its length.
- Both arrays up to 10^5: binary search on the length with a rolling hash of every window.
- The longest common subarray of *k* arrays.
