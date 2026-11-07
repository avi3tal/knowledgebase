# Fibonacci Number

> Difficulty: **easy** · Patterns: dp-1d, recursion, fibonacci-numbers · Sources: [leetcode](https://leetcode.com/problems/fibonacci-number/)

## Problem
`F(0) = 0`, `F(1) = 1`, and `F(n) = F(n-1) + F(n-2)` for `n > 1`. Given `n`, return `F(n)`.

## Examples
- `n = 2` → `1` (F(1) + F(0) = 1 + 0)
- `n = 4` → `3` (0, 1, 1, 2, **3**)
- `n = 10` → `55`

## Constraints
- `0 <= n <= 30` on LeetCode. The benchmark goes up to n = 2048 so that the O(n) vs O(2^n)
  difference shows. It stays small because Python integers grow and big-int additions stop
  being O(1).

## Pattern & how to recognise it
- **A recurrence defined in terms of smaller inputs** → recursion. If the same subproblems are
  recomputed (F(n-2) is needed by both F(n) and F(n-1)), that's **overlapping subproblems** and
  the cue for **dynamic programming**.
- This is the "hello world" of 1-D DP. The same shape appears in Climbing Stairs, House Robber
  and Min Cost Climbing Stairs.

## Learning material
- **Naive recursion** builds a binary call tree of depth n, so about 2^n calls: O(2^n) time and
  O(n) stack.
- **Memoization (top-down):** cache `F(k)` the first time it's computed. Each k is computed
  once, giving O(n) time and O(n) space.
- **Tabulation (bottom-up):** fill `dp[0..n]` in order. Since `dp[i]` only needs the previous
  two values, keep two variables instead: O(n) time, **O(1) space**.
- See [algo/notes/patterns.md](../../notes/patterns.md) (Recursion / DP) and
  [algo/notes/complexity.md](../../notes/complexity.md).

## Hints
<details><summary>Hint 1</summary>

Draw the call tree for F(5). How many times is F(2) computed?
</details>
<details><summary>Hint 2</summary>

To compute F(i), how many earlier values do you actually need to keep?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`a, b = 0, 1`, then repeat n times: `a, b = b, a + b`; return `a`.
Time O(n), space O(1).
</details>

## Follow-ups
- O(log n) using matrix exponentiation or fast doubling.
- Return F(n) mod 10^9+7 for huge n.
- Climbing Stairs (LeetCode 70) is the same recurrence in disguise.
