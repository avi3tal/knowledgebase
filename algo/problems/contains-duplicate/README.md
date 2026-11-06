# Contains Duplicate

> Difficulty: **easy** · Patterns: hashmap, arrays-hashing · Sources: [leetcode](https://leetcode.com/problems/contains-duplicate/), [neetcode](https://neetcode.io/problems/duplicate-integer)

## Problem
Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if
every element is distinct.

## Examples
- `nums = [1, 2, 3, 1]` → `true`
- `nums = [1, 2, 3, 4]` → `false`
- `nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]` → `true`

## Constraints
- `0 <= len(nums) <= 10^5`, `-10^9 <= nums[i] <= 10^9`
- O(n²) pair comparison is too slow at 10^5; O(n) with a set, or O(n log n) with sorting.

## Pattern & how to recognise it
- **"Have I seen this before?"** → a **hash set** of values seen so far; return on the first hit.
- Trade-off: sorting first gives O(1) extra space (if you may mutate) at O(n log n) time, since
  duplicates become adjacent.
- See [algo/notes/patterns.md](../../notes/patterns.md) (HashMaps).

## Learning material
- **Hash set:** average O(1) insert/lookup. In Go, `map[int]struct{}` is the idiomatic set:
  `struct{}` takes zero bytes.
- Early exit: return `true` as soon as a value repeats; only a fully distinct array needs the
  whole pass (that's the worst case to benchmark).
- One-liner equivalent: `len(set(nums)) != len(nums)` (always O(n), no early exit).
- NeetCode explanation: https://neetcode.io/problems/duplicate-integer

## Hints
<details><summary>Hint 1</summary>

What would you need to remember about the elements you've already passed?
</details>
<details><summary>Hint 2</summary>

Which data structure answers "is x in here?" in O(1)?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`seen = set()`; for `x` in `nums`: if `x in seen` return `true`; `seen.add(x)`. Return `false`.
Time O(n), space O(n).
</details>

## Follow-ups
- Duplicate within distance `k` (LeetCode 219, sliding-window set).
- Values within `t` and indices within `k` (LeetCode 220, buckets).
- O(1) extra space when values are in `1..n` (index marking / Floyd cycle, LeetCode 287).
