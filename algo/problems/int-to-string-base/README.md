# Convert an Integer to a String in Any Base

> Difficulty: **easy** · Patterns: recursion, math · Sources: [interactivepython](https://runestone.academy/ns/books/published/pythonds/Recursion/pythondsConvertinganIntegertoaStringinAnyBase.html)

## Problem
Given a non-negative integer `n` and a base `2 <= base <= 16`, return the representation of `n`
in that base as a string. Use the digits `0-9` then `A-F`, with no leading zeros (`0` is `"0"`).
Write it **recursively**, without `bin`, `hex`, `format` or `strconv`.

## Examples
- `n = 30, base = 16` → `"1E"`.
- `n = 10, base = 10` → `"10"`.
- `n = 5, base = 2` → `"101"`.

## Constraints
- `0 <= n <= 2^31 - 1`, `2 <= base <= 16`.
- The result has `floor(log_base n) + 1` digits, so O(log n) time and recursion depth.

## Pattern & how to recognise it
- **"Digits of a number in some base"** → repeated **divmod**: `n % base` is the last digit and
  `n // base` is everything before it.
- **Recursion fits naturally:** `to_str(n) = to_str(n // base) + digit(n % base)`. The recursion
  produces the digits **most-significant first**, with no reversal. An iterative loop produces
  them in reverse, so you push onto a stack or reverse at the end.
- **The base case is `n < base`, not `n <= base`:** `n == base` already needs two digits
  (`"10"`).

## Learning material
- **The three laws of recursion** (from the source course): a base case, a move toward the base
  case, and a call to itself. Here the move is dividing by `base`, which shrinks `n`
  geometrically, so the depth is O(log n).
- **Lookup string for digits:** `"0123456789ABCDEF"[d]` maps 0..15 to a character.
- **Strings vs stacks:** concatenating on the way back up is O(d^2) in the worst case for `d`
  digits. Pushing digits onto a list and joining once is O(d).
- Reference: https://runestone.academy/ns/books/published/pythonds/Recursion/pythondsConvertinganIntegertoaStringinAnyBase.html

## Hints
<details><summary>Hint 1</summary>

What's the last digit of `n` in base `b`? What number has all the other digits?
</details>
<details><summary>Hint 2</summary>

Which values of `n` are a single digit? Be careful with the boundary.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`digits = "0123456789ABCDEF"`. If `n < base`, return `digits[n]`. Otherwise return
`to_str(n // base, base) + digits[n % base]`. Time O(log n), space O(log n) for the stack.
</details>

## Follow-ups
- Negative numbers: handle the sign, then recurse on `abs(n)`.
- Convert to Base -7 / Base -2 (LeetCode 504, 1017): a negative base needs a non-negative
  remainder adjustment.
- Convert a Number to Hexadecimal (LeetCode 405): two's complement for negatives, using bit
  masks.
- The reverse direction: parse a string in base `b` into an integer (Horner's rule).
