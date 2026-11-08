# Apply Operations To An Array

> Difficulty: **easy** · Patterns: two-pointers · Sources: [leetcode](https://leetcode.com/problems/apply-operations-to-an-array/)
## Problem
Given `nums` (non-negative integers), do `n - 1` operations in order: for `i = 0 .. n-2`, if
`nums[i] == nums[i+1]` then `nums[i] *= 2` and `nums[i+1] = 0`, otherwise do nothing. After all
operations, move all `0`s to the end keeping the order of the rest. Return the resulting array.

## Examples
- `[1,2,2,1,1,0]` → after the operations `[1,4,0,2,0,0]` → `[1,4,2,0,0,0]`.
- `[0,1]` → `[1,0]`.
- `[2,2,4]` → `[4,0,4]` → `[4,4,0]`: the two 4s are **not** merged (operations run once, left to right).

## Constraints
- `2 <= n <= 2000`, `0 <= nums[i] <= 1000`. Target: O(n) time, O(1) extra space.

## Pattern & how to recognise it
- Simulation + "move zeros to the end keeping order" → it's [move-zeroes](../move-zeroes/README.md)
  with a warm-up step. Good drill: recognise the sub-problem you've already solved.
- Lesson: [Two Pointers — same direction](../../learn/two-pointers/02-same-direction.md).

## Learning material
- Step 1 is a plain left-to-right scan; note that after `nums[i+1] = 0` the next comparison is
  `0` vs `nums[i+2]`, which naturally prevents double merging.
- Step 2 is the read/write pointer. You can even fuse them: do the operation at `i`, then
  immediately treat `nums[i]` as the element being read.

## Hints
<details><summary>Hint 1</summary>

Do it in two clean passes first. The second pass is a problem you've already solved.
</details>
<details><summary>Hint 2</summary>

To fuse the passes: after deciding the final value of `nums[i]`, it never changes again, so it's
ready to be "read".
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Pass 1: for `i` in `0..n-2`, if `nums[i] == nums[i+1]`: `nums[i] *= 2; nums[i+1] = 0`.
Pass 2: move zeroes (`write = 0`, swap every non-zero into `write`). Return `nums`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- One pass (fuse the operation and the compaction).
- Compare with the 2048 game "slide and merge" row operation.
