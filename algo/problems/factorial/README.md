# Factorial of a Number

> Difficulty: **easy** · Patterns: recursion, stack, math · Sources: [interactivepython](https://runestone.academy/ns/books/published/pythonds/Recursion/toctree.html)

## Problem
Given a non-negative integer `n`, return `n! = n · (n-1) · … · 1`, with `0! = 1`.

## Examples
- `n = 5` → `120`
- `n = 0` → `1` (the empty product)
- `n = 20` → `2432902008176640000` (the largest that fits in a signed 64-bit integer)

## Constraints
- `0 <= n <= 20` in the cases, so results fit in `int64`. Python ints are unbounded, but past about a
  few thousand the cost of big-int multiplication dominates.
- The benchmark goes to n = 512. A recursive solution with depth n is fine there but would hit
  Python's default recursion limit (1000) beyond that.

## Pattern & how to recognise it
- **A definition in terms of a smaller instance** (`n! = n · (n-1)!`) → recursion with a base case.
- Any recursion can be turned into a loop with an **explicit stack**, which is exactly what the call
  stack does for you. This is the classic exercise for seeing that.
- See [algo/notes/stack.md](../../notes/stack.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- **Recursion anatomy:** a base case (`n == 0 → 1`) plus a recursive case that moves toward it.
  The depth is n, so the stack is O(n). In Python, deep recursion raises `RecursionError` (see
  `sys.getrecursionlimit()`), and Python has no tail-call optimisation.
- **Iterative:** `acc = 1; for i in 2..n: acc *= i` is O(n) multiplications and O(1) extra space.
- **Explicit stack:** push `n, n-1, …, 1`, then pop and multiply. It mirrors what the call stack
  holds, using O(n) space. It's educational, but the plain loop is strictly better.
- The cost of each multiplication grows with the number of digits (n! has Θ(n log n) bits), so
  "O(n)" counts multiplications, not bit operations.

## Hints
<details><summary>Hint 1</summary>

What is the smallest input whose answer you know without computing anything?
</details>
<details><summary>Hint 2</summary>

Recursion and a loop both work. Try writing both, plus a version with an explicit stack.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Loop `i` from 2 to n, multiplying an accumulator that starts at 1. Time O(n) multiplications,
space O(1). The recursive version is O(n) time and O(n) stack.
</details>

## Follow-ups
- Count trailing zeros of n! (LeetCode 172) without computing it.
- `n! mod p` for large n. Inverse factorials for nCr mod p.
- Rewrite any recursive function iteratively with an explicit stack.
