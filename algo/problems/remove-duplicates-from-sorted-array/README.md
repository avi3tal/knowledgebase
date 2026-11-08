# Remove Duplicates From Sorted Array

> Difficulty: **easy** · Patterns: two-pointers · Sources: [leetcode](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)
## Problem
`nums` is sorted in non-decreasing order. Remove the duplicates **in place** so each value
appears once, keeping the order. The unique values must end up in `nums[0..k-1]`.

**Harness note:** LeetCode returns `k`; here return the kept prefix `nums[:k]`.

## Examples
- `[1,1,2]` → `[1,2]`.
- `[0,0,1,1,1,2,2,3,3,4]` → `[0,1,2,3,4]`.
- `[7,7,7,7]` → `[7]`.

## Constraints
- `1 <= n <= 3·10^4`, `-100 <= nums[i] <= 100`, sorted.
- Target: one pass, O(1) extra space (so no hash set).

## Pattern & how to recognise it
- **Sorted** means duplicates are adjacent, so you only need to compare with a neighbour.
- **In place** + "first k elements" → **read/write pointers**.
- Lesson: [Two Pointers — same direction](../../learn/two-pointers/02-same-direction.md) (the
  read-write trace is exactly this problem).
- Siblings: [move-zeroes](../move-zeroes/README.md), [remove-element](../remove-element/README.md);
  linked-list version: [remove-duplicates-from-sorted-list](../remove-duplicates-from-sorted-list/README.md);
  next step: [remove-duplicates-from-sorted-array-ii](../remove-duplicates-from-sorted-array-ii/README.md).

## Learning material
- Invariant: `nums[0..write-1]` is the unique values seen so far.
- Keep test: `nums[read] != nums[write-1]`, compare with the **last kept** value. (Comparing with
  `nums[read-1]` happens to work here too, but the "last kept" form is the one that generalises
  to "at most k copies".)
- `nums[0]` is always kept, so start with `write = 1`.

## Hints
<details><summary>Hint 1</summary>

Because the array is sorted, how do you know an element is new?
</details>
<details><summary>Hint 2</summary>

Compare the current element with the last element you kept.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`write = 1`; for `read` in `1..n-1`: if `nums[read] != nums[write-1]`, `nums[write] = nums[read]; write++`.
Return `nums[:write]`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- Allow at most 2 copies (Remove Duplicates II) or at most k.
- Unsorted input: hash set (O(n) space) or sort first (O(n log n)).
