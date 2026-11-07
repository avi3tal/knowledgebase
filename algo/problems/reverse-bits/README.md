# Reverse Bits

> Difficulty: **easy** · Patterns: bit-manipulation · Sources: [leetcode](https://leetcode.com/problems/reverse-bits/)

## Problem
`n` is a **32-bit unsigned** integer (given as a non-negative int in `0 .. 2^32 − 1`). Reverse
the order of its 32 bits, so bit 0 becomes bit 31, bit 1 becomes bit 30, and so on. Return the
result as a non-negative integer.

## Examples
- `n = 43261596` (`00000010100101000001111010011100`) → `964176192`
  (`00111001011110000010100101000000`).
- `n = 4294967293` (`11111111111111111111111111111101`) → `3221225471`
  (`10111111111111111111111111111111`).
- `n = 1` → `2147483648`: the lowest bit moves to the top.

## Constraints
- `0 <= n < 2^32`. Leading zeros count: all 32 positions are reversed.
- Exactly 32 iterations, so O(1) time.

## Pattern & how to recognise it
- "Bits of a fixed-width integer, rearranged" → **shift and mask**: read the lowest bit with
  `n & 1`, shift `n` right, and push the bit into the result from the other side with
  `(result << 1) | bit`.
- Lesson: [Bit Manipulation](../../learn/bit-manipulation/01-intro.md).

## Learning material
- `n & 1` reads the last bit; `n >> 1` drops it; `x << 1 | b` appends bit `b` to `x`.
- Python ints are unbounded (no overflow, no sign bit to worry about here), so the loop must run
  **exactly 32 times**, not "while n > 0", or the leading zeros are lost.
- In Go use `uint32` (or mask with `0xFFFFFFFF`).
- [Bitwise operation (Wikipedia)](https://en.wikipedia.org/wiki/Bitwise_operation)

## Hints
<details><summary>Hint 1</summary>

How do you read the lowest bit of `n`, and how do you append a bit to the low end of another number?
</details>
<details><summary>Hint 2</summary>

Why does stopping when `n` becomes 0 give the wrong answer for `n = 1`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`result = 0`; repeat 32 times: `result = (result << 1) | (n & 1)`; `n >>= 1`. Return `result`.

Expected complexity: time O(1) (32 steps), space O(1).

</details>

## Follow-ups
- Called millions of times: precompute the reversal of every byte (256 entries) and combine 4 lookups.
- Divide and conquer: swap halves, then quarters, … with masks (5 steps, no loop).
