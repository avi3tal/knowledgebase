# Move Zeroes

> Difficulty: **easy** · Patterns: two-pointers · Sources: [leetcode](https://leetcode.com/problems/move-zeroes/), [algomaster](https://algomaster.io/practice/dsa/move-zeroes?list=am-300)
## Problem
Given an integer array `nums`, move all `0`s to the end **in place**, keeping the relative order
of the non-zero elements. Don't copy the array.

## Examples
- `[0,1,0,3,12]` → `[1,3,12,0,0]`: the non-zeros `1,3,12` keep their order.
- `[0]` → `[0]`.
- `[1,2,0,0]` → `[1,2,0,0]`: already done, nothing should move.

## Constraints
- `1 <= n <= 10^4`, `-2^31 <= nums[i] <= 2^31 - 1`.
- Target: one pass, O(1) extra space. Follow-up from the statement: minimise the number of writes.

## Pattern & how to recognise it
- **In place** + **keep the order of the survivors** + "push the rest to the end" → **same-direction
  two pointers** (read / write). It's the in-place *filter* template.
- Naive: every time you see a `0`, shift everything after it left by one → O(n²). Or build a new
  array → O(n) extra space, which the statement forbids.
- Lesson: [Two Pointers — same direction](../../learn/two-pointers/02-same-direction.md) (watch
  the move-zeroes trace).
- Same trick: [remove-element](../remove-element/README.md),
  [remove-duplicates-from-sorted-array](../remove-duplicates-from-sorted-array/README.md),
  [apply-operations-to-an-array](../apply-operations-to-an-array/README.md) (this problem is its
  second half), stretch: [remove-duplicates-from-sorted-array-ii](../remove-duplicates-from-sorted-array-ii/README.md).

## Learning material
**The read/write pointer, stated as an invariant.** Say it out loud *before* coding:

> Everything in `nums[0 .. write-1]` is final: the non-zeros seen so far, in order.
> `read` scans every element exactly once.

There are only two cases per element, and that's the whole algorithm:

| `nums[read]` | action |
|---|---|
| non-zero (a keeper) | put it at `write`, then `write++` |
| zero | do nothing, `read` moves on |

If you *swap* instead of copy, the zeros ride along to the right for free. Progress table for
`[0,1,0,3,12]` (swap version):

```
read  nums[read]  action                  nums              write
 0       0        skip                    [0,1,0,3,12]       0
 1       1        swap(0,1), write++      [1,0,0,3,12]       1
 2       0        skip                    [1,0,0,3,12]       1
 3       3        swap(1,3), write++      [1,3,0,0,12]       2
 4      12        swap(2,4), write++      [1,3,12,0,0]       3
```

Why it's safe: `write <= read` always, so you never overwrite something you haven't read yet,
and everything between `write` and `read` is a zero.

**The overcomplication trap.** If you find yourself tracking "where the next zero is" or nested
loops, stop: track *where the next keeper goes* instead. The `write != read` guard before a swap
is an optional micro-optimisation (skips self-swaps), not part of correctness.

- Reading: [LeetCode editorial — Move Zeroes](https://leetcode.com/problems/move-zeroes/editorial/).

## Hints
<details><summary>Hint 1</summary>

Instead of moving zeros right, think about moving non-zeros left. Where should the next non-zero go?
</details>
<details><summary>Hint 2</summary>

Keep one index `write` = "the next slot for a non-zero". Scan with a second index.
</details>
<details><summary>Hint 3</summary>

Copy-then-fill works (copy keepers forward, then write zeros from `write` to the end). Swapping
does both in one pass.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`write = 0`. For each `read` in `0..n-1`: if `nums[read] != 0`, swap `nums[write]` and
`nums[read]`, then `write += 1`.

Alternative (each slot written at most once): copy keepers to `nums[write++]`, then set
`nums[write..n-1] = 0`.

Expected complexity: time O(n), space O(1).
</details>

## Follow-ups
- Minimise writes: the swap version writes 2× per keeper; the copy+fill version writes each slot once.
- Move zeros to the **front** instead (scan from the right with the write pointer at the end).
- Generalise to "keep elements matching a predicate": remove-element, remove-duplicates.
- Stable partition by parity (Sort Array By Parity): same loop with a different "keep" test.
