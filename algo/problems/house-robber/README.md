# House Robber

> Difficulty: **medium** · Patterns: fibonacci-numbers · Sources: [leetcode](https://leetcode.com/problems/house-robber/)

## Problem
Houses stand in a row and `nums[i]` is the money in house `i`. You can't rob two **adjacent**
houses. Return the most money you can rob.

## Examples
- `[1, 2, 3, 1]` → `4`: rob houses 0 and 2.
- `[2, 7, 9, 3, 1]` → `12`: rob houses 0, 2 and 4.
- `[2, 1, 1, 2]` → `4`: rob houses 0 and 3. You can skip two houses in a row.

## Constraints
- `1 <= len(nums) <= 100`, `0 <= nums[i] <= 400`.
- Trying every non-adjacent subset is exponential. Aim for O(n) time and O(1) space.

## Pattern & how to recognise it
- At house `i` you either **skip it** (keep the best up to `i−1`) or **rob it** (its money plus
  the best up to `i−2`). The answer depends on the **last two answers** → **Fibonacci-style
  1-D DP**.
- Greedy (rob the richest house, or every other house) fails: `[5, 9, 5]`, `[2, 1, 1, 2]`.
- It's the PDF's "House Thief".
- Lesson: [Fibonacci Numbers](../../learn/fibonacci-numbers/02-variants.md).

## Learning material
- `best[i] = max(best[i-1], best[i-2] + nums[i])`, with `best[-1] = best[-2] = 0`.
- Two variables replace the array: `prev2, prev1 = prev1, max(prev1, prev2 + x)`.
- Read: [House Robber explained (NeetCode)](https://neetcode.io/problems/house-robber).

## Hints
<details><summary>Hint 1</summary>

For the last house there are only two options. What are they?
</details>
<details><summary>Hint 2</summary>

Which earlier answers does each option need?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`prev2 = prev1 = 0`. For each `x`: `prev2, prev1 = prev1, max(prev1, prev2 + x)`. Return `prev1`.

Expected complexity: time O(n), space O(1).

</details>

## Follow-ups
- Houses in a circle (House Robber II).
- Houses in a binary tree (House Robber III): tree DFS returning (rob, skip) pairs.
- Return which houses to rob.
