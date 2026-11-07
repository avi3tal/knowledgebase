# Swap Two Elements Without a Temp Variable

> Difficulty: **easy** · Patterns: math, bit-manipulation, bitwise-xor · Sources: —

## Problem
Given an integer array `nums` and two indices `i` and `j` with `i != j`, swap `nums[i]` and
`nums[j]` **in place without using a third (temporary) variable**. Return nothing; `nums` is
checked after the call.

## Examples
- `nums = [4, 8], i = 0, j = 1` → `nums` becomes `[8, 4]`
- `nums = [1, 2, 3, 4, 5], i = 1, j = 3` → `[1, 4, 3, 2, 5]`
- `nums = [5, 5], i = 0, j = 1` → `[5, 5]`

## Constraints
- `2 <= len(nums) <= 100`, `0 <= i, j < len(nums)`, `i != j`
- `-10^9 <= nums[k] <= 10^9`
- O(1) time and O(1) extra space.

## Pattern & how to recognise it
- "No temporary variable" is a tell for an **arithmetic** (`a = a + b; b = a - b; a = a - b`)
  or **XOR** (`a ^= b; b ^= a; a ^= b`) swap: the first operation packs both values into one
  slot, the next two unpack them.
- In real code you'd write `a, b = b, a` (same syntax in Python and Go) and let the
  compiler handle it; this is a puzzle about invertible operations.

## Learning material
- **Arithmetic swap:** after `a += b`, `a` holds the sum; `b = a - b` recovers the old `a`, and
  `a = a - b` recovers the old `b`. Each step is invertible, so nothing is lost. In fixed-width languages (Go, C) `a + b` can **overflow**; Go's
  wrap-around arithmetic still gives the right answer, C's signed overflow is undefined behaviour.
- **XOR swap:** `x ^ x = 0` and `x ^ 0 = x` make the three XORs undo each other; no overflow.
- **Aliasing pitfall:** both tricks zero the value when the two operands are the *same* memory
  location (`i == j`): `a += a` then `a = a - a = 0`. Guard with `if i != j`.
- XOR swap algorithm: https://en.wikipedia.org/wiki/XOR_swap_algorithm

## Hints
<details><summary>Hint 1</summary>

Can one slot temporarily hold information about both numbers?
</details>
<details><summary>Hint 2</summary>

Sum and difference (or XOR) are invertible: from `a + b` and `b` you can get `a` back.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`nums[i] += nums[j]; nums[j] = nums[i] - nums[j]; nums[i] -= nums[j]`
(or the XOR version). Time O(1), space O(1).
</details>

## Follow-ups
- What happens if `i == j`? (Both tricks zero the element — add a guard.)
- Does it work for floats? (No: rounding breaks `a + b - b == a`.) For strings/objects? (No.)
- Swap without a temp in Go/C: overflow behaviour of the arithmetic version.
