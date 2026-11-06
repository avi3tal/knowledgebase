# Pascal's Triangle Row (k-th row)

> Difficulty: **easy** · Patterns: dp-1d, math · Sources: [interviewbit](https://www.interviewbit.com/problems/kth-row-of-pascals-triangle/), [leetcode](https://leetcode.com/problems/pascals-triangle-ii/)

## Problem
Given a 0-based `row_index`, return that row of Pascal's triangle. Row 0 is `[1]`.

## Examples
- `row_index = 3` → `[1, 3, 3, 1]`
- `row_index = 0` → `[1]`
- `row_index = 4` → `[1, 4, 6, 4, 1]`

## Constraints
- `0 <= row_index <= 33` (LeetCode); larger rows overflow 64-bit integers past ~row 66.
- Follow-up asks for **O(k) extra space**, i.e. don't keep the whole triangle.

## Pattern & how to recognise it
- Same recurrence as [Pascal's Triangle](../pascal-triangle/README.md), but you only need the
  last row → **rolling 1-D DP**: keep one array and update it in place.
- Or skip the recurrence entirely: the row is `C(k, 0..k)`, computable directly (math).

## Learning material
- **In-place row update:** append a `1`, then walk **right to left** doing
  `row[j] += row[j-1]`. Going right to left means `row[j-1]` still holds the *previous* row's value
  when you read it — the same trick as the 0/1 knapsack 1-D table.
- **Direct formula:** `C(k, j) = C(k, j-1) * (k - j + 1) / j`, exact in integers if you multiply
  before dividing. O(k) time.
- Recursion `row(k) = f(row(k-1))` is correct but uses O(k) stack frames.
- LeetCode editorial: https://leetcode.com/problems/pascals-triangle-ii/editorial/

## Hints
<details><summary>Hint 1</summary>

You only ever need the previous row to compute the next one.
</details>
<details><summary>Hint 2</summary>

Can you update a single array in place? In which direction must you iterate so you don't
overwrite a value you still need?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`row = [1]`; repeat `k` times: `row.append(1)`, then for `j` from `len(row) - 2` down to `1`:
`row[j] += row[j-1]`. Time O(k²), space O(k).
Or the multiplicative formula: O(k) time, O(k) space for the output.
</details>

## Follow-ups
- Return the whole triangle → [Pascal's Triangle](../pascal-triangle/README.md).
- Compute a single `C(n, k) mod p` for huge n (Lucas' theorem / factorials with modular inverses).
