# Reverse an Array Recursively

> Difficulty: **easy** · Patterns: recursion, two-pointers · Sources: [interactivepython](https://runestone.academy/ns/books/published/pythonds/Recursion/toctree.html)

## Problem
Given an array `nums`, return its elements in reverse order. Write it **recursively**, without
`reversed`, slicing with a negative step, or `list.reverse` / `slices.Reverse`.

## Examples
- `[1,2,3,4,5]` → `[5,4,3,2,1]`.
- `[]` → `[]`.
- `[7]` → `[7]`.

## Constraints
- `0 <= len(nums) <= 500` (the recursion depth stays under Python's default limit of 1000).
- Target: O(n) time, O(n) recursion depth (or O(log n) with divide and conquer).

## Pattern & how to recognise it
- **"Do it recursively"** → define the answer for `nums` in terms of the answer for a
  **smaller** array, plus a base case:
  - *Peel one element:* `reverse(nums) = [last] + reverse(nums without last)`. It's simple, but
    each call copies, which makes it O(n^2).
  - *Two pointers as recursion:* `rev(i, j)`: if `i >= j`, stop; otherwise swap `nums[i]` and
    `nums[j]` and call `rev(i+1, j-1)`. That's O(n) time, in place, with depth n/2.
- The iterative twin is the classic **two-pointer swap**, which uses O(1) space.

## Learning material
- **Three laws of recursion:** a base case (`len <= 1`, or `i >= j`), a move toward it (a
  shorter range), and a recursive call.
- **Hidden costs:** in Python, `nums[1:]` and `[x] + rest` copy the list, so a recursion that
  slices at every level is O(n^2) overall. Pass indices instead.
- **Mutating vs returning:** decide whether the function reverses **in place** (and returns
  nothing) or **returns a new list**, and be consistent. `list.pop()` *removes* an element; it
  doesn't reverse anything on its own.
- Reference: https://runestone.academy/ns/books/published/pythonds/Recursion/TheThreeLawsofRecursion.html

## Hints
<details><summary>Hint 1</summary>

What's the reverse of an empty list, or of a single element? That's your base case.
</details>
<details><summary>Hint 2</summary>

If you swap the first and last elements, what's left to reverse?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Copy `nums` into `out`. Define `rev(i, j)`: if `i >= j`, return; otherwise swap `out[i]` and
`out[j]`, then call `rev(i+1, j-1)`. Call `rev(0, n-1)` and return `out`. Time O(n), space
O(n) (the copy plus about n/2 frames).
</details>

## Follow-ups
- Reverse a string recursively. Reverse a linked list recursively (LeetCode 206).
- Reverse String (LeetCode 344): in place on a char array, with O(1) extra space.
- Rotate an array by `k` (LeetCode 189) using three reversals.
