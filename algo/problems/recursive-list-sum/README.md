# Sum of a List (Recursive)

> Difficulty: **easy** · Patterns: recursion · Sources: [interactivepython](https://runestone.academy/ns/books/published/pythonds/Recursion/CalculatingtheSumofaListofNumbers.html), [w3resource](https://www.w3resource.com/python-exercises/data-structures-and-algorithms/python-recursion.php)

## Problem
Return the sum of a list of integers **using recursion** (no loops, no built-in `sum`).
The sum of an empty list is `0`.

## Examples
- `[1, 2, 3, 4]` → `10`
- `[7]` → `7`
- `[]` → `0`

## Constraints
- `0 <= len(nums) <= 500`, `-10^9 <= nums[i] <= 10^9`.
- The length is capped because a recursion depth of n hits Python's default limit (1000).

## Pattern & how to recognise it
- **"Solve it recursively"** on a linear structure → split into *first element + the rest* (or
  halves) and define the base case for the smallest input.
- The base case should be the **empty** input, not a one-element input. Otherwise `[]` breaks.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- **Three laws of recursion** (interactivepython): have a base case, move toward it, and call
  yourself.
- **Hidden cost of slicing:** `nums[1:]` copies the rest of the list, so `head + f(nums[1:])` is
  O(n²) time and O(n²) total allocation. Pass an **index** instead (`f(nums, i)`) for O(n) time.
- **Divide and conquer:** `f(lo, hi) = f(lo, mid) + f(mid, hi)` keeps the recursion depth at
  O(log n), which sidesteps the recursion limit.

## Hints
<details><summary>Hint 1</summary>

What is the sum of an empty list? Use that as the base case.
</details>
<details><summary>Hint 2</summary>

Avoid slicing. Pass the current index down the recursion.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`f(i) = 0 if i == len(nums) else nums[i] + f(i + 1)`. Time O(n), space O(n) recursion
(O(log n) with the halving split).
</details>

## Follow-ups
- Nested lists (`[1, 2, [3, 4], [5, 6]]` → 21): recurse into sub-lists (the w3resource exercise 3).
- Tail recursion with an accumulator, and why Python doesn't optimise it.
- Related recursion warm-ups: [Factorial](../factorial/README.md),
  [Square via recursion](../square-via-recursion/README.md),
  [Integer to string in any base](../int-to-string-base/README.md).
