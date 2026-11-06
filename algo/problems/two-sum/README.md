# Two Sum

> Difficulty: **easy** · Patterns: hashmap, two-pointers · Sources: [leetcode](https://leetcode.com/problems/two-sum/)

## Problem
Given an array of integers `nums` and an integer `target`, return the **indices** of the two
numbers that add up to `target`. Exactly one solution exists, and the same element may not be used
twice. The two indices can be returned in any order.

## Examples
- `nums = [2,7,11,15], target = 9` → `[0,1]` (2 + 7 = 9)
- `nums = [3,2,4], target = 6` → `[1,2]` (2 + 4; index 0 cannot be used twice)
- `nums = [3,3], target = 6` → `[0,1]`

## Constraints
- `2 <= len(nums) <= 10^4`, `-10^9 <= nums[i], target <= 10^9`
- Exactly one valid answer.
- With n = 10^4, O(n²) passes on LeetCode, but the interview expectation is O(n).

## Pattern & how to recognise it
- **"Find two elements that combine to X"** → for each element, ask "have I already seen its
  complement `target - x`?" A **hash map** answers that in O(1), turning the nested loop into
  a single pass.
- If the array were **sorted** (or you only need values, not original indices), **two pointers**
  from both ends solve it in O(n) time with O(1) extra space. Sorting first costs O(n log n) and
  loses the original indices, which is why the hashmap wins here.
- See [algo/notes/patterns.md](../../notes/patterns.md) (HashMaps).

## Learning material
- **Hash map:** average O(1) insert and lookup. Store `value → index` for the elements seen so
  far. Checking the complement *before* inserting the current element prevents using it twice.
- **Two pointers on a sorted array:** if `nums[i] + nums[j]` is too small, move `i` right;
  if it's too big, move `j` left. Each step discards one candidate, so the search is O(n).
- NeetCode explanation: https://neetcode.io/problems/two-integer-sum

## Hints
<details><summary>Hint 1</summary>

For a fixed `nums[i]`, which exact value would you need to find?
</details>
<details><summary>Hint 2</summary>

Can you remember what you've already seen, so that finding that value is O(1)?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Single pass with `seen = {}` (value → index). For each `i, x`: if `target - x` is in `seen`,
return `[seen[target - x], i]`; otherwise set `seen[x] = i`.
Time O(n), space O(n).
</details>

## Follow-ups
- The input is sorted → two pointers, O(1) space (LeetCode 167).
- Return all unique pairs, or three numbers (3Sum, LeetCode 15).
- Only report whether a pair exists, for a stream of numbers or data too big for memory.
