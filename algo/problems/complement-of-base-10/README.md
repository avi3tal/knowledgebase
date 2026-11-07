# Complement of Base 10 Integer

> Difficulty: **easy** · Patterns: bitwise-xor · Sources: [leetcode](https://leetcode.com/problems/complement-of-base-10-integer/)

## Problem
The **complement** of an integer is the integer you get by flipping every bit of its binary
representation (`0 → 1`, `1 → 0`), with no leading zeros. Given `n`, return its complement.

## Examples
- `n = 5` → `2` (`101` → `010`)
- `n = 7` → `0` (`111` → `000`)
- `n = 10` → `5` (`1010` → `0101`)
- `n = 0` → `1` (`0` is written with one digit)

## Constraints
- `0 <= n < 10^9`

## Pattern & how to recognise it
- "**Flip** every bit" → **Bitwise XOR** with a mask of ones: `x ^ 1` flips a bit and `x ^ 0`
  keeps it.
- The catch is the width. `~n` flips infinitely many leading zeros too (in Python
  `~5 == -6`), so the mask must cover exactly the bits of `n`.
- Lesson: [Bitwise XOR — variants](../../learn/bitwise-xor/02-variants.md).

## Learning material
- A mask of `w` ones is `(1 << w) − 1`. `w` is the bit length of `n`: Python `n.bit_length()`,
  Go `bits.Len(uint(n))`, or count right shifts until `n` becomes 0.
- `n ^ mask` flips exactly the low `w` bits.
- [XOR (Wikipedia)](https://en.wikipedia.org/wiki/Exclusive_or)

## Hints
<details><summary>Hint 1</summary>

Which operation flips a bit when combined with 1, and keeps it when combined with 0?
</details>
<details><summary>Hint 2</summary>

Build a number that has a 1 in every bit position that `n` uses, and nowhere else.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If `n == 0`, return 1. Otherwise `mask = (1 << bit_length(n)) − 1` and return `n ^ mask`. Time
O(log n) (or O(1) with a hardware bit-length), space O(1).
</details>

## Follow-ups
- Number Complement (LeetCode 476), which is the same with `n >= 1`.
- Flip only the bits between positions `i` and `j`.
