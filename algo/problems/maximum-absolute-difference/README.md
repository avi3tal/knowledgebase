# Maximum Absolute Difference

> Difficulty: **medium** · Patterns: math, arrays-hashing · Sources: [interviewbit](https://www.interviewbit.com/problems/maximum-absolute-difference/)

## Problem
Given an integer array `nums`, return the maximum of
`f(i, j) = |nums[i] - nums[j]| + |i - j|` over all index pairs `i, j` (0 for a single element).

## Examples
- `nums = [1, 3, -1]` → `5` (`i = 1, j = 2`: `|3 - (-1)| + |1 - 2| = 5`)
- `nums = [1]` → `0`
- `nums = [2, 2]` → `1` (values equal, indices differ by 1)

## Constraints
- `1 <= len(nums) <= 10^5`, `-10^9 <= nums[i] <= 10^9`
- n = 10^5 → the O(n²) all-pairs loop is too slow; O(n) expected.

## Pattern & how to recognise it
- **Sum of absolute values over pairs** → expand the absolute values. With `i > j`,
  `|a - b| + (i - j)` is one of:
  `(a + i) - (b + j)` or `(a - i) - (b - j)` (times ±1).
  So the answer is `max(max(A) - min(A), max(B) - min(B))` with `A[k] = nums[k] + k`,
  `B[k] = nums[k] - k`.
- Signal: "maximise |x_i - x_j| + |y_i - y_j|" is Manhattan distance; the ± expansion turns it
  into max-minus-min of transformed values.

## Learning material
- `|x| = max(x, -x)`, so `|p| + |q| = max(p + q, p - q, -p + q, -p - q)`. Grouping each term by
  index gives a per-element value, and "max over pairs of (u_i - u_j)" is just `max(u) - min(u)`.
- The same trick solves the maximum Manhattan distance between points in 2-D in O(n).
- InterviewBit problem page: https://www.interviewbit.com/problems/maximum-absolute-difference/

## Hints
<details><summary>Hint 1</summary>

Assume `nums[i] >= nums[j]` and `i >= j`. What does `f` simplify to? Now the other sign cases.
</details>
<details><summary>Hint 2</summary>

Each case is `(something about i) - (the same thing about j)`. Maximising that over pairs is
`max - min` of one array.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

One pass tracking `max/min of nums[k] + k` and `max/min of nums[k] - k`; return the larger of the
two spreads. Time O(n), space O(1).
</details>

## Follow-ups
- Maximum Manhattan distance between 2-D points.
- Minimise instead of maximise (needs sorting / different idea).
