# Reverse Integer

> Difficulty: **medium** · Patterns: math · Sources: [leetcode](https://leetcode.com/problems/reverse-integer/)

## Problem
Given a signed 32-bit integer `x`, return `x` with its decimal digits reversed (keeping the
sign). If the result falls outside the signed 32-bit range `[-2^31, 2^31 - 1]`, return `0`.
Assume the environment cannot store 64-bit integers.

## Examples
- `x = 123` → `321`
- `x = -123` → `-321`
- `x = 120` → `21`
- `x = 1534236469` → `0` (9646324351 overflows)

## Constraints
- `-2^31 <= x <= 2^31 - 1`
- At most 10 digits, so the loop is O(log₁₀ x) — effectively constant.

## Pattern & how to recognise it
- **Digit manipulation:** pop the last digit with `x % 10`, push it with `rev * 10 + digit`.
- The real test is **overflow detection without a wider type**: check *before* multiplying
  whether `rev > (2^31 - 1) / 10` (or equal and the next digit > 7).

## Learning material
- Pop/push: `digit = x % 10; x //= 10; rev = rev * 10 + digit`.
- Negative numbers: Python's `%` and `//` round toward −∞ (`-123 % 10 == 7`), Go/C truncate toward
  zero (`-123 % 10 == -3`). Work on `abs(x)` and restore the sign, or rely on truncation in Go.
- Python ints never overflow, so a final range check works there; in Go/C/Java you must check
  before the multiplication that would overflow.
- LeetCode editorial: https://leetcode.com/problems/reverse-integer/editorial/

## Hints
<details><summary>Hint 1</summary>

How do you take the last digit off a number, and how do you append a digit to another number?
</details>
<details><summary>Hint 2</summary>

`rev * 10 + d` can overflow. What must be true of `rev` before you compute it?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Loop while `x != 0`: `d = x % 10` (truncating), `x /= 10`; if
`rev > MAX/10 || (rev == MAX/10 && d > 7)` return 0 (mirror for negatives with `MIN` and `-8`);
`rev = rev * 10 + d`. Time O(log x), space O(1).
</details>

## Follow-ups
- Palindrome number without converting to a string (LeetCode 9): reverse half the digits.
- String to integer with overflow (LeetCode 8, atoi).
