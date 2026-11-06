# Sqrt(x)

> Difficulty: **easy** · Patterns: binary-search, math · Sources: [leetcode](https://leetcode.com/problems/sqrtx/), [interviewbit](https://www.interviewbit.com/problems/square-root-of-integer/)

## Problem
Given a non-negative integer `x`, return `floor(sqrt(x))` without using any built-in power or
square-root function (no `x ** 0.5`, no `math.sqrt`).

## Examples
- `x = 4` → `2`
- `x = 8` → `2` (sqrt(8) ≈ 2.83, rounded down)
- `x = 0` → `0`, `x = 1` → `1`

## Constraints
- `0 <= x <= 2^31 - 1`.
- Trying `1, 2, 3, …` is O(√x), about 46,000 steps at the top. Aim for **O(log x)**.

## Pattern & how to recognise it
- **"Find the largest k such that k² <= x"** → **binary search on the answer**. The predicate
  `k*k <= x` is monotone in k (true, true, …, true, false, false, …), and you want the last true.
- See [algo/notes/patterns.md](../../notes/patterns.md) (Binary Search).

## Learning material
- **Binary search on a predicate:** keep `lo..hi` so the answer is inside it. When `mid*mid <= x`,
  record `mid` as a candidate and go right. Otherwise go left. The last recorded candidate is the
  floor.
- For `x >= 2` the root is at most `x // 2`, which tightens the initial `hi`.
- In fixed-width languages `mid * mid` can overflow. Compare `mid <= x / mid` instead, or use 64-bit.
- **Newton's method** `r = (r + x // r) // 2` converges quadratically and is also O(log x) steps.
- Reading: https://leetcode.com/problems/sqrtx/editorial/

## Hints
<details><summary>Hint 1</summary>

The answer lies between 0 and x. Is `k*k <= x` monotone in k?
</details>
<details><summary>Hint 2</summary>

Binary search for the last k where it holds.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If `x < 2`, return x. `lo, hi = 1, x // 2`, `ans = 0`. While `lo <= hi`: if `mid*mid <= x`, set
`ans = mid` and `lo = mid + 1`, else `hi = mid - 1`. Return `ans`. Time O(log x), space O(1).
</details>

## Follow-ups
- Valid Perfect Square (LeetCode 367).
- Square root with k decimal places (binary search on floats, or Newton).
- Integer k-th root.
