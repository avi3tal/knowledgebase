# Counting Bits

> Difficulty: **easy** · Patterns: bit-manipulation, dp-1d · Sources: [leetcode](https://leetcode.com/problems/counting-bits/)

## Problem
Given an integer `n`, return a list `ans` of length `n + 1` where `ans[i]` is the number of `1`
bits in the binary representation of `i`, for every `i` from `0` to `n`.

## Examples
- `n = 2` → `[0, 1, 1]` (0 = `0`, 1 = `1`, 2 = `10`).
- `n = 5` → `[0, 1, 1, 2, 1, 2]` (3 = `11`, 4 = `100`, 5 = `101`).

## Constraints
- `0 <= n <= 10^5`.
- Counting each number's bits separately is O(n log n). Do it in **O(n)**: each answer from
  an earlier one, in O(1).

## Pattern & how to recognise it
- "For every i from 0 to n" + a property of the binary form → **reuse a smaller number's answer**
  through a bit identity. That's a 1-D DP whose transition is a bit operation.
- Useful identities: `i >> 1` drops the lowest bit; `i & (i − 1)` clears the lowest set bit.
- Lesson: [Bit Manipulation](../../learn/bit-manipulation/01-intro.md).

## Learning material
- `i >> 1` is `i // 2`: the same bits shifted right, so it has the same count except for the
  dropped last bit, which is `i & 1`.
- `i & (i − 1)` turns off the lowest `1` bit of `i` (Brian Kernighan's trick), so it has exactly
  one `1` fewer.
- Both give an O(1) recurrence from a smaller index you've already filled.
- [Bit manipulation (Wikipedia)](https://en.wikipedia.org/wiki/Bit_manipulation)

## Hints
<details><summary>Hint 1</summary>

Write 0..8 in binary. How do the bits of `i` relate to the bits of `i // 2`?
</details>
<details><summary>Hint 2</summary>

Fill `ans` left to right; for each `i`, which smaller index already holds almost the right answer?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`ans[0] = 0`; for `i` in `1..n`: `ans[i] = ans[i >> 1] + (i & 1)` (or
`ans[i] = ans[i & (i − 1)] + 1`).

Expected complexity: time O(n), space O(n) for the output.

</details>

## Follow-ups
- Count the bits of a single 32-bit number in O(number of set bits).
- Sum of the bit counts of all numbers 1..n in O(log n).
