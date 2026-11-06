# Pascal's Triangle

> Difficulty: **easy** · Patterns: dp-1d, arrays-hashing · Sources: [interviewbit](https://www.interviewbit.com/problems/pascal-triangle/), [leetcode](https://leetcode.com/problems/pascals-triangle/)

## Problem
Given `num_rows`, return the first `num_rows` rows of Pascal's triangle. Each row starts and ends
with `1`; every inner value is the sum of the two values directly above it.

## Examples
- `num_rows = 5` →
  `[[1], [1,1], [1,2,1], [1,3,3,1], [1,4,6,4,1]]`
- `num_rows = 1` → `[[1]]`
- `num_rows = 0` → `[]`

## Constraints
- `0 <= num_rows <= 30` (values fit in 32-bit integers up to row 30).
- The output alone has ~n²/2 numbers, so O(n²) time is optimal.

## Pattern & how to recognise it
- **Each row depends only on the previous row** → bottom-up DP where the "state" is the last row.
  Signals: "each value is the sum of the values above it", a recurrence over rows.
- Recursion (row k = f(row k-1)) works too, but costs a stack frame per row; a simple loop is the
  idiomatic form.

## Learning material
- Row `r`, column `c` (0-based) holds the binomial coefficient `C(r, c)`, and
  `C(r, c) = C(r-1, c-1) + C(r-1, c)` is exactly the "sum of the two above" rule.
- Building row by row: row `r` has `r + 1` values, so total work is `1 + 2 + … + n = O(n²)`.
- Base cases are where off-by-one bugs live: `num_rows = 0` and `num_rows = 1` must not return a
  pre-seeded two-row triangle.
- Pascal's triangle (Wikipedia): https://en.wikipedia.org/wiki/Pascal%27s_triangle

## Hints
<details><summary>Hint 1</summary>

Start from `[[1]]`. How do you get the next row from the last row in the triangle?
</details>
<details><summary>Hint 2</summary>

The new row is `1`, then `prev[i] + prev[i+1]` for every adjacent pair, then `1`.
Check what you return for 0 and 1 rows.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`triangle = []`; for `r` in `0..num_rows-1`: `row = [1] * (r + 1)`, and for `c` in `1..r-1`
set `row[c] = triangle[r-1][c-1] + triangle[r-1][c]`; append `row`.
Time O(n²), space O(n²) (the output).
</details>

## Follow-ups
- Return only the k-th row in O(k) extra space → [Pascal's Triangle Row](../pascal-triangle-row/README.md).
- Return the single value at (row, column) without building the triangle: `C(r, c)` computed
  multiplicatively in O(c), or with memoised recursion.
