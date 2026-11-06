# Subarray With Given Sum

> Difficulty: **medium** · Patterns: sliding-window, two-pointers · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1)

## Problem
Given an array `arr` of **non-negative** integers and a positive integer `target`, find a
contiguous subarray whose sum equals `target`. Return its **1-based** `[start, end]` indices, or
`[-1]` if none exists. If several exist, return the one that **ends first**; among those, the one
that starts first.

## Examples
- `arr = [1, 2, 3, 7, 5], target = 12` → `[2, 4]` (2 + 3 + 7)
- `arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target = 15` → `[1, 5]`
- `arr = [1, 4, 20, 3, 10, 5], target = 33` → `[3, 5]` (20 + 3 + 10; the window has to drop
  both 1 and 4 before it fits)

## Constraints
- `1 <= len(arr) <= 10^5`, `0 <= arr[i] <= 10^9`, `1 <= target <= 10^9`
- n up to 10^5 → O(n²) over all subarrays is too slow; O(n) expected.

## Pattern & how to recognise it
- **Contiguous subarray + non-negative values + target sum** → **variable-size sliding window**.
  Because values are non-negative, extending the window never decreases the sum and shrinking never
  increases it, so the window sum is monotone in both pointers.
- With negative numbers the monotonicity breaks → use **prefix sums + hashmap** instead.
- See [algo/notes/patterns.md](../../notes/patterns.md) (Sliding window).

## Learning material
- **Variable window template:** for each `right`, add `arr[right]`; then **while** the sum is too
  big, subtract `arr[left]` and advance `left`; then check for equality. Each index enters and
  leaves the window once → O(n).
- Common bugs: shrinking with `if` instead of `while` (one step per element is not enough), and
  forgetting to add the current element on an iteration where you shrink.
- **Prefix sums:** `sum(l..r) = P[r+1] - P[l]`; store seen prefix sums in a hashmap to handle
  negatives in O(n) time / O(n) space.
- GfG explanation: https://www.geeksforgeeks.org/find-subarray-with-given-sum/

## Hints
<details><summary>Hint 1</summary>

Keep a running sum of a window `[left, right]`. What should happen when it becomes too large?
</details>
<details><summary>Hint 2</summary>

After adding `arr[right]`, shrink from the left **as many times as needed** before comparing.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`left = 0, s = 0`; for `right` in range(n): `s += arr[right]`; `while s > target and left <= right:
s -= arr[left]; left += 1`; `if s == target: return [left + 1, right + 1]`. Return `[-1]`.
Time O(n), space O(1).
</details>

## Follow-ups
- Negative numbers allowed → prefix sum + hashmap (LeetCode 560 counts all such subarrays).
- Count the subarrays instead of returning one.
- Smallest subarray with sum ≥ target (LeetCode 209).
