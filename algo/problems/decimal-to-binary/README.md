# Decimal to Binary

> Difficulty: **easy** · Patterns: math, stack · Sources: [interactivepython](https://runestone.academy/ns/books/published/pythonds/BasicDS/ConvertingDecimalNumberstoBinaryNumbers.html)

## Problem
Given a non-negative integer `num`, return its binary representation as a string, without
leading zeros (`0` → `"0"`). Don't use built-ins such as `bin()` or `strconv.FormatInt`.

## Examples
- `num = 100` → `"1100100"`
- `num = 0` → `"0"`
- `num = 255` → `"11111111"`

## Constraints
- `0 <= num <= 10^9`
- The output has `floor(log2(num)) + 1` digits, so O(log n) is the target.

## Pattern & how to recognise it
- **Repeated division by the base**: `num % 2` is the least significant bit, `num // 2` drops it.
  The bits come out **in reverse order** → push them on a **stack** (or reverse at the end).
- This is the textbook "stack reverses order" example from *Problem Solving with Algorithms and
  Data Structures*. See [algo/notes/stack.md](../../notes/stack.md).

## Learning material
- Any base `b`: digits are `num % b` repeatedly, read in reverse. For bases above 10 map digits
  through a lookup string like `"0123456789ABCDEF"`.
- Loop invariant: `num_original = num * b^k + (value of the k digits produced so far)`.
- Edge case: the loop `while num > 0` produces **no digits** for `0`; special-case it.
- Bit view: `num & 1` and `num >> 1` are the binary-specific forms of `% 2` and `// 2`.
- Runestone chapter: https://runestone.academy/ns/books/published/pythonds/BasicDS/ConvertingDecimalNumberstoBinaryNumbers.html

## Hints
<details><summary>Hint 1</summary>

What does `num % 2` tell you, and what is left after `num // 2`?
</details>
<details><summary>Hint 2</summary>

You get the bits from least to most significant. Which data structure reverses an order?
And what does your loop return for `0`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If `num == 0` return `"0"`. Otherwise push `num % 2` and set `num //= 2` until `num == 0`, then
pop everything into a string. Time O(log n), space O(log n).
</details>

## Follow-ups
- Generalise to any base 2..16 (`convertToBase(num, base)`), and to negative numbers
  (two's complement for a fixed width, or a leading `-`).
- The reverse: parse a binary/hex string into an integer (Horner's rule).
