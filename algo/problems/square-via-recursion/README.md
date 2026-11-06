# Square of a Number via Recursion

> Difficulty: **easy** · Patterns: recursion, math · Sources: [educative](https://www.educative.io/courses/recursion-for-coding-interviews-in-python)

## Problem
Given a non-negative integer `n`, return `n²` **recursively, without multiplying `n` by itself**.
Use the identity `(n-1)² = n² - 2n + 1`, i.e. `n² = (n-1)² + 2n - 1`.

## Examples
- `n = 5` → `25` (`16 + 2·5 - 1`)
- `n = 1` → `1`
- `n = 0` → `0`

## Constraints
- `0 <= n <= 500`. The recursion depth is n, so this stays under Python's default limit of 1000.

## Pattern & how to recognise it
- **A recurrence handed to you** → translate it directly into a base case plus a recursive case.
  This is a pure "recursion mechanics" exercise.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- Base case: `square(0) = 0`. Recursive case: `square(n) = square(n-1) + 2n - 1`. Each call does
  O(1) work and there are n of them: O(n) time and O(n) stack.
- The identity is the sum of the first n odd numbers: `1 + 3 + 5 + … + (2n-1) = n²`.
- **Faster recursion:** `square(n) = 4·square(n // 2)` for even n, plus `2n - 1` corrections for
  odd n. That halves n each time, giving O(log n) depth.

## Hints
<details><summary>Hint 1</summary>

Rearrange the identity so that `n²` is on the left.
</details>
<details><summary>Hint 2</summary>

What is the square of 0?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`square(n) = 0 if n == 0 else square(n - 1) + 2*n - 1`. Time O(n), space O(n) recursion.
</details>

## Follow-ups
- Support negative `n` (square `abs(n)`).
- O(log n) recursion by halving.
- Related warm-ups: [Sum of a List (Recursive)](../recursive-list-sum/README.md), [Factorial](../factorial/README.md).
