# Number Factors

> Difficulty: **medium** · Patterns: fibonacci-numbers · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/count-ofdifferent-ways-express-n-sum-1-3-4/)

## Problem
Given `n`, count the ways to write it as an **ordered** sum of the numbers 1, 3 and 4. Different
orders count as different ways (`1 + 3` and `3 + 1` are two ways). `n = 0` has one way (the
empty sum). Return the count **modulo 10⁹ + 7**.

## Examples
- `n = 4` → `4`: 4, 1+3, 3+1, 1+1+1+1.
- `n = 5` → `6`: 1+4, 4+1, 1+1+3, 1+3+1, 3+1+1, 1+1+1+1+1.
- `n = 2` → `1`: 1+1.

## Constraints
- `0 <= n <= 10^5`.
- The plain recursion makes three calls per level, O(3ⁿ). Aim for O(n) time and O(1) space.

## Pattern & how to recognise it
- The **last** number in the sum is 1, 3 or 4, so `ways(n) = ways(n−1) + ways(n−3) + ways(n−4)`.
  Each answer depends on a **fixed number of earlier answers** → **Fibonacci-style 1-D DP**.
- **Order matters**, so this is *not* Coin Change II (which counts combinations with the coins in
  the outer loop). Here the amount is the only loop.
- Lesson: [Fibonacci Numbers](../../learn/fibonacci-numbers/02-variants.md).

## Learning material
- Base cases: `ways(0) = 1`, and `ways(negative) = 0`. That gives `ways(1) = 1`, `ways(2) = 1`,
  `ways(3) = 2`.
- Bottom-up: fill `dp[0..n]` left to right. Only the last four values are read, so a small
  rolling buffer (or four variables) is enough.
- Read: [Count ways to express n as a sum of 1, 3 and 4 (GeeksforGeeks)](https://www.geeksforgeeks.org/count-ofdifferent-ways-express-n-sum-1-3-4/).

## Hints
<details><summary>Hint 1</summary>

Look at the last number in the sum. What's left before it?
</details>
<details><summary>Hint 2</summary>

Climbing stairs with steps of 1 or 2 is `f(n−1) + f(n−2)`. What changes with steps 1, 3 and 4?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dp[0] = 1`, and for `i` in `1..n`: `dp[i] = dp[i-1] + (dp[i-3] if i >= 3) + (dp[i-4] if i >= 4)`,
modulo 10⁹ + 7. Keep only the last four values for O(1) space.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Any set of allowed numbers `steps` (generalised staircase).
- Count unordered sums instead (Coin Change II).
