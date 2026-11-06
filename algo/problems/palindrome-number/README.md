# Palindrome Number

> Difficulty: **easy** · Patterns: math · Sources: [leetcode](https://leetcode.com/problems/palindrome-number/)

## Problem
Given an integer `x`, return `true` if it reads the same forwards and backwards in base 10,
and `false` otherwise. Solve it **without converting the number to a string**.

## Examples
- `121` → `true`.
- `-121` → `false`, because read backwards it is `121-`.
- `10` → `false`, because read backwards it is `01`.

## Constraints
- `-2^31 <= x <= 2^31 - 1`.
- A number has `d = log10(x) + 1` digits, so the target is O(log x) time and O(1) space.

## Pattern & how to recognise it
- **"Digits of an integer, no string conversion"** → **digit arithmetic**: `x % 10` peels off the
  last digit and `x // 10` drops it.
- **"Palindrome"** → compare the first half with the reversed second half. Reverse only **half**
  of the number. Stop when the reversed part is `>=` what is left. That avoids overflow in
  fixed-width languages and halves the work.
- See [algo/notes/patterns.md](../../notes/patterns.md).

## Learning material
- **Reversing digits:** `rev = rev * 10 + x % 10; x //= 10` moves one digit per step, and there
  are O(log10 x) steps.
- **Integer vs true division:** in Python 3, `/` always returns a float (`12 / 10 == 1.2`). Digit
  arithmetic needs `//`. In Go, `/` on ints truncates.
- **Edge cases:** negatives are never palindromes. A number that ends in `0` is a palindrome
  only if it is `0`, since no number starts with `0`.
- **Odd digit count:** after reversing half of `12321` you have `x = 12` and `rev = 123`.
  Compare `x == rev // 10`.
- Reference: https://leetcode.com/problems/palindrome-number/editorial/

## Hints
<details><summary>Hint 1</summary>

How do you get the last digit of a number? How do you remove it?
</details>
<details><summary>Hint 2</summary>

You don't need to reverse the whole number. When do you know you've reached the middle?
</details>
<details><summary>Hint 3</summary>

Handle `x < 0` and "ends in 0 but isn't 0" before the loop.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Return false if `x < 0` or `(x % 10 == 0 and x != 0)`. Then, while `x > rev`, move the last
digit of `x` onto `rev` using integer division. At the end, return `x == rev or x == rev // 10`.
Time O(log x), space O(1).
</details>

## Follow-ups
- Do it with the string conversion (two pointers), and compare the costs.
- [Valid Palindrome](../valid-palindrome/README.md): a string palindrome that ignores
  non-alphanumerics and case.
- Reverse Integer (LeetCode 7): the same digit loop plus 32-bit overflow detection.
