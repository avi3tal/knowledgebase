# Remove Element

> Difficulty: **easy** · Patterns: two-pointers · Sources: [leetcode](https://leetcode.com/problems/remove-element/)
## Problem
Given an integer array `nums` and a value `val`, remove every occurrence of `val` **in place**.
The kept elements must end up in `nums[0..k-1]` (keep their relative order here) and what's left
after them doesn't matter.

**Harness note:** LeetCode returns `k`. Here return the kept prefix `nums[:k]` (Go: `nums[:k]`,
a slice of the same array), so the tests check both the length and the contents.

## Examples
- `nums = [3,2,2,3], val = 3` → `[2,2]` (k = 2).
- `nums = [0,1,2,2,3,0,4,2], val = 2` → `[0,1,3,0,4]` (k = 5).
- `nums = [4,4,4], val = 4` → `[]`.

## Constraints
- `0 <= n <= 100`, `0 <= nums[i] <= 50`, `0 <= val <= 100`.
- Target: one pass, O(1) extra space.

## Pattern & how to recognise it
- "Remove … **in place**", "the first k elements", "beyond k doesn't matter" → **read/write
  pointers**. It is [move-zeroes](../move-zeroes/README.md) with `0` replaced by `val`.
- Lesson: [Two Pointers — same direction](../../learn/two-pointers/02-same-direction.md).
- Siblings: [remove-duplicates-from-sorted-array](../remove-duplicates-from-sorted-array/README.md),
  [apply-operations-to-an-array](../apply-operations-to-an-array/README.md).

## Learning material
- Invariant: `nums[0..write-1]` holds exactly the kept elements seen so far, in order.
- One question per element: *keep it?* (`nums[read] != val`). Keep → `nums[write] = nums[read]; write++`.
- You only need to **copy**, not swap: the tail after `write` is garbage you're allowed to leave.
- Go note: `nums[:write]` is O(1), it reuses the backing array.

## Hints
<details><summary>Hint 1</summary>

Where does the next element you keep go?
</details>
<details><summary>Hint 2</summary>

Same loop as move zeroes, but copy instead of swap: the values after `k` don't matter.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`write = 0`; for each `x` in `nums`: if `x != val`, `nums[write] = x; write++`. Return `nums[:write]`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- Order doesn't matter and `val` is rare: swap the bad element with the **last** element and
  shrink `n` (opposite-ends variant), fewer writes.
- Remove every element that appears in a given set (hash set + same loop).
