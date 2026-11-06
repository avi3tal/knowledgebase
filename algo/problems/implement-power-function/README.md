# Implement Power Function

> Difficulty: **medium** · Patterns: math, bit-manipulation, binary-search · Sources: [interviewbit](https://www.interviewbit.com/problems/implement-power-function/), [leetcode](https://leetcode.com/problems/powx-n/)

## Problem
Given integers `x`, `n >= 0` and `d >= 1`, return `x^n mod d` as a value in `[0, d)`, so a
negative `x` must still give a non-negative remainder. Don't compute `x^n` itself, because it is
astronomically large.

## Examples
- `x = 2, n = 3, d = 3` → `2` (8 mod 3)
- `x = -1, n = 1, d = 20` → `19`, not -1
- `x = 0, n = 0, d = 1` → `0` (`0^0 = 1` and `1 mod 1 = 0`)

## Constraints
- `-10^9 <= x <= 10^9`, `0 <= n <= 10^9`, `1 <= d <= 10^9`.
- n up to 10^9 rules out n multiplications. You need **O(log n)**: binary (fast) exponentiation.

## Pattern & how to recognise it
- **Huge exponent + modulus** → exponentiation by squaring: `x^n = (x^(n/2))²` for even n,
  `x · (x^((n-1)/2))²` for odd n. Each step halves `n`, the same "halve the problem" idea as
  binary search.
- Reduce mod `d` after **every** multiplication so intermediates stay below `d²`.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- **Iterative (bit) form:** walk the bits of `n` from the least significant. Keep `base = x^(2^i) mod d`.
  When bit i is set, multiply it into the result. This is O(log n) time and O(1) space.
- **Recursive form:** `p = pow(x, n // 2)`, return `p·p` or `x·p·p`. This is O(log n) time and
  O(log n) stack.
- **Modular arithmetic:** `(a·b) mod d = ((a mod d)·(b mod d)) mod d`. Python's `%` already returns
  a value in `[0, d)` for `d > 0`. In C, Java and Go, `%` keeps the sign of the dividend, so add `d`
  when the result is negative.
- Python's built-in `pow(x, n, d)` does exactly this.
- Reading: https://cp-algorithms.com/algebra/binary-exp.html

## Hints
<details><summary>Hint 1</summary>

How can you get `x^n` from `x^(n/2)` with a single multiplication?
</details>
<details><summary>Hint 2</summary>

Look at the binary representation of `n`. Each set bit contributes a factor `x^(2^i)`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`res = 1 % d`, `base = x % d`. While `n > 0`: if `n & 1`, set `res = res * base % d`. Then
`base = base * base % d` and `n >>= 1`. Return `res`. Time O(log n), space O(1).
</details>

## Follow-ups
- `Pow(x, n)` with float `x` and negative `n` (LeetCode 50): `x^-n = 1 / x^n`, and watch `n = INT_MIN`.
- Matrix exponentiation (Fibonacci in O(log n)).
- Modular inverse via Fermat: `a^(p-2) mod p`.
