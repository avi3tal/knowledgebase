# Flip and Invert an Image

> Difficulty: **easy** · Patterns: bitwise-xor, two-pointers · Sources: [leetcode](https://leetcode.com/problems/flipping-an-image/)

## Problem
Given an `n x n` binary matrix `image`, **flip** it horizontally (reverse each row), then
**invert** it (replace each 0 with 1 and each 1 with 0), and return the resulting image.
Modifying the input in place and returning it is fine.

## Examples
- `image = [[1,1,0],[1,0,1],[0,0,0]]` → `[[1,0,0],[0,1,0],[1,1,1]]`
  (flip: `[[0,1,1],[1,0,1],[0,0,0]]`, then invert)
- `image = [[1,1,0,0],[1,0,0,1],[0,1,1,1],[1,0,1,0]]` →
  `[[1,1,0,0],[0,1,1,0],[0,0,0,1],[1,0,1,0]]`

## Constraints
- `1 <= n <= 20`, `image[i][j]` is `0` or `1`.

## Pattern & how to recognise it
- "**Invert**" a 0/1 value → **Bitwise XOR** with 1 (`v ^ 1`). "Flip a row" → **Two
  Pointers** swapping from both ends.
- Do both in **one pass** per row: swap `row[lo]` and `row[hi]`, and XOR each with 1 as you go.
  The middle cell of an odd row is only inverted.
- Lesson: [Bitwise XOR — variants](../../learn/bitwise-xor/02-variants.md).

## Learning material
- `v ^ 1`: `0 ^ 1 = 1`, `1 ^ 1 = 0`. It's a branch-free toggle.
- Two pointers on a row: `lo = 0`, `hi = n − 1`, and swap while `lo <= hi`. When `lo == hi`, the
  cell must still be inverted exactly once.
- O(n²) time for an `n x n` image, because every cell is touched once. O(1) extra space.

## Hints
<details><summary>Hint 1</summary>

Which single operation turns 0 into 1 and 1 into 0?
</details>
<details><summary>Hint 2</summary>

Flipping a row swaps cell `j` with cell `n − 1 − j`. Can you invert both cells while you swap
them?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For each row: `lo, hi = 0, n − 1`. While `lo <= hi`: set `row[lo], row[hi] = row[hi] ^ 1,
row[lo] ^ 1`, then `lo += 1`, `hi -= 1`. When `lo == hi`, this inverts the middle cell once.
Return the image. Time O(n²), space O(1).
</details>

## Follow-ups
- Observation: if `row[lo] != row[hi]`, flip-then-invert leaves both unchanged.
- Rotate the image 90° in place (LeetCode 48).
