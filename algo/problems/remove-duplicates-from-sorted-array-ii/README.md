# Remove Duplicates From Sorted Array Ii

> Difficulty: **medium** · Patterns: two-pointers · Sources: [leetcode](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/)
## Problem
`nums` is sorted. Remove duplicates **in place** so each value appears **at most twice**, keeping
the order. The result must be in `nums[0..k-1]`.

**Harness note:** LeetCode returns `k`; here return the kept prefix `nums[:k]`.

Stretch problem: do [remove-duplicates-from-sorted-array](../remove-duplicates-from-sorted-array/README.md) first.

## Examples
- `[1,1,1,2,2,3]` → `[1,1,2,2,3]`.
- `[0,0,1,1,1,1,2,3,3]` → `[0,0,1,1,2,3,3]`.
- `[2,2,2,2,2]` → `[2,2]`.

## Constraints
- `1 <= n <= 3·10^4`, sorted. Target: one pass, O(1) extra space.

## Pattern & how to recognise it
- Same read/write template as the "at most once" version; only the **keep test** changes.
- Lesson: [Two Pointers — same direction](../../learn/two-pointers/02-same-direction.md).
- Family: [move-zeroes](../move-zeroes/README.md), [remove-element](../remove-element/README.md).

## Learning material
- Invariant: `nums[0..write-1]` is valid (each value at most twice).
- The trap: counting run lengths with an extra counter variable. You don't need it: since the
  kept prefix is sorted, the new element would be a **third** copy exactly when it equals the
  element **two slots back in the kept prefix**.
- That gives the general rule for "at most k copies": keep `x` if `write < k` or `x != nums[write-k]`.

## Hints
<details><summary>Hint 1</summary>

Write down the keep test from the previous problem using `write`. What changes for "at most two"?
</details>
<details><summary>Hint 2</summary>

Look two positions back in the *kept* part, not the read part.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`write = 0`; for each `x`: if `write < 2 || x != nums[write-2]`, `nums[write] = x; write++`.
Return `nums[:write]`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- Parametrise by k. Why does comparing with `nums[read-2]` fail? (Earlier writes overwrote it.)
