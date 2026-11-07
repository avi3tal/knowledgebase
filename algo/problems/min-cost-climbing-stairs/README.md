# Min Cost Climbing Stairs

> Difficulty: **easy** · Patterns: fibonacci-numbers · Sources: [leetcode](https://leetcode.com/problems/min-cost-climbing-stairs/)

## Problem
`cost[i]` is what you pay when you step **on** stair `i`. Once you've paid, you can climb one or
two stairs. You may start on stair 0 or stair 1. Return the minimum total cost to reach the
**top**, which is the position just past the last stair.

## Examples
- `cost = [10, 15, 20]` → `15`: start on stair 1, pay 15, climb two to the top.
- `cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]` → `6`: step only on the 1s.
- `cost = [0, 1, 2, 2]` → `2`: 0 → stair 2 (pay 2) → top.

## Constraints
- `2 <= len(cost) <= 1000`, `0 <= cost[i] <= 999`.
- Trying every path is O(2ⁿ). Aim for O(n) time and O(1) extra space.

## Pattern & how to recognise it
- To reach position `i` you came from `i − 1` or `i − 2`. The best cost at `i` depends **only
  on the last two answers** → **Fibonacci-style 1-D DP**.
- Greedy (always step to the cheaper of the next two stairs) fails, because a cheap step now can
  force an expensive one later.
- Lesson: [Fibonacci Numbers](../../learn/fibonacci-numbers/01-intro.md).

## Learning material
- `best[i]` = minimum cost to stand at position `i` (before paying `cost[i]`).
  `best[0] = best[1] = 0`, `best[i] = min(best[i-1] + cost[i-1], best[i-2] + cost[i-2])`.
  The answer is `best[n]`.
- Only the last two values are needed, so two variables replace the array.

## Hints
<details><summary>Hint 1</summary>

Where could you have been just before reaching position `i`?
</details>
<details><summary>Hint 2</summary>

Treat the top as position `n` and fill positions 0..n in order.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`a, b = 0, 0` (best at positions `i-2`, `i-1`). For `i` in `2..n`:
`a, b = b, min(b + cost[i-1], a + cost[i-2])`. Return `b`.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Allow climbing 1, 2 or 3 stairs.
- Return the stairs you step on.
