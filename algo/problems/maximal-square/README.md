# Maximal Square

> Difficulty: **medium** · Patterns: dp-2d · Sources: [leetcode](https://leetcode.com/problems/maximal-square/), [youtube](https://www.youtube.com/watch?v=FO7VXDfS8Gk)

## Problem
Given an `rows x cols` binary matrix of `0`s and `1`s, return the **area** of the largest square
that contains only `1`s. (LeetCode passes characters `"0"`/`"1"`. Here the cells are ints.)

## Examples
- ```text
  1 0 1 0 0
  1 0 1 1 1
  1 1 1 1 1
  1 0 0 1 0
  ```
  → `4`: the 2x2 block at rows 1-2, columns 3-4.
- `[[1,0],[0,1]]` → `1`: diagonal ones don't form a 2x2 square.
- `[[0]]` → `0`.

## Constraints
- `1 <= rows, cols <= 300`, cells are `0` or `1`.
- Up to 90,000 cells. Trying every top-left corner and every size is O((rows·cols)·min²), too slow.
  Aim for O(rows·cols). In the benchmark, `n` is the number of cells (a √n x √n matrix).

## Pattern & how to recognise it
- **"Largest square / rectangle of 1s in a grid"** → 2-D DP where each cell stores the best shape
  that *ends* (has its bottom-right corner) there.
- A square of side `k` ending at `(r, c)` needs squares of side `k-1` ending at the top, left and
  top-left neighbours, so the cell depends on those three.
- See [algo/notes/patterns.md](../../notes/patterns.md) and [algo/notes/complexity.md](../../notes/complexity.md).

## Learning material
- `dp[r][c]` = side of the largest all-ones square whose bottom-right corner is `(r, c)`.
  If `matrix[r][c] == 0` it is 0, otherwise `1 + min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1])`.
  The `min` is the bottleneck: the square can only grow as far as its most limited neighbour.
- Answer = `(max dp)²`. The question asks for area, not side.
- Only the previous row is read, so a single 1-D array (plus one saved diagonal value) is enough:
  O(cols) extra space.
- Video: https://www.youtube.com/watch?v=FO7VXDfS8Gk

## Hints
<details><summary>Hint 1</summary>

Fix the bottom-right corner of the square. What do you need to know about the cells above, to the
left, and diagonally up-left?
</details>
<details><summary>Hint 2</summary>

Take the minimum of those three neighbours' answers and add one.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Iterate rows top to bottom and columns left to right. For each `1`, set
`dp[r][c] = 1 + min(top, left, top-left)`, treating out-of-range cells as 0. Track the max side and
return `side * side`. Time O(rows·cols), space O(cols) with a rolling row (O(rows·cols) with a full table).
</details>

## Follow-ups
- Maximal Rectangle (LeetCode 85): histogram per row + monotonic stack.
- Count Square Submatrices with All Ones (LeetCode 1277): sum all `dp` values.
- Do it in O(1) extra space by overwriting the input (if mutation is allowed).
