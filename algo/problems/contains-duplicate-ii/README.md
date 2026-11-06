# Contains Duplicate II

> Difficulty: **easy** · Patterns: sliding-window, arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/contains-duplicate-ii/)

## Problem
Given an integer array `nums` and an integer `k`, return `true` if there are two **distinct
indices** `i` and `j` with `nums[i] == nums[j]` and `abs(i - j) <= k`.

## Examples
- `nums = [1,2,3,1], k = 3` → `true` (indices 0 and 3)
- `nums = [1,0,1,1], k = 1` → `true` (indices 2 and 3)
- `nums = [1,2,3,1,2,3], k = 2` → `false` (equal values are always 3 apart)

## Constraints
- `1 <= len(nums) <= 10^5`, `0 <= k <= 10^5`. An O(n·k) scan is too slow at the limits; aim
  for O(n).

## Pattern & how to recognise it
- "Two equal values **at most k apart**" means: is there a duplicate inside **any window of k+1
  consecutive elements**? That's a **fixed-size sliding window**.
- The window state is a **set** of the values currently inside it. Membership tells you about a
  duplicate in O(1).
- Lesson: [Sliding Window](../../learn/sliding-window/01-intro.md).

## Learning material
- A fixed window over indices `[i-k, i]`. Before adding `nums[i]`, check whether it's already
  in the set. After adding, evict `nums[i-k]` once the set would hold more than k elements.
- An equivalent alternative is a hash map `value → last index`, checking `i - last[v] <= k`.
  It's still O(n), and it avoids eviction.

## Hints
<details><summary>Hint 1</summary>

Only the previous k elements matter when you're at index i.
</details>
<details><summary>Hint 2</summary>

Keep those k elements in a structure with O(1) membership, and drop the oldest as you move.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Walk i from left to right with a set `window`. If `nums[i]` is in `window`, return true.
Otherwise add it, and if `len(window) > k`, remove `nums[i-k]`. Return false at the end.
Time O(n), space O(min(n, k)).
</details>

## Follow-ups
- Contains Duplicate III (LeetCode 220): values within `t` of each other. Use buckets, or a
  sorted window.
- [Contains Duplicate](../contains-duplicate/README.md): no distance limit.
