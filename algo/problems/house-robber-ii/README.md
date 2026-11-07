# House Robber II

> Difficulty: **medium** · Patterns: fibonacci-numbers · Sources: [leetcode](https://leetcode.com/problems/house-robber-ii/)

## Problem
Same as House Robber, but the houses stand in a **circle**: the first and the last house are
neighbours. `nums[i]` is the money in house `i`. You can't rob two adjacent houses. Return the
most money you can rob.

## Examples
- `[2, 3, 2]` → `3`: houses 0 and 2 are neighbours, so rob house 1.
- `[1, 2, 3, 1]` → `4`: rob houses 0 and 2.
- `[1, 2, 3]` → `3`.

## Constraints
- `1 <= len(nums) <= 100`, `0 <= nums[i] <= 1000`.
- Aim for O(n) time and O(1) space.

## Pattern & how to recognise it
- Each house is still "skip it or rob it, based on the last two answers" → **Fibonacci-style
  1-D DP**.
- The circle only adds one constraint: you can't rob **both** house 0 and house n−1. Break the
  circle by solving two straight lines.
- Lesson: [Fibonacci Numbers](../../learn/fibonacci-numbers/02-variants.md).

## Learning material
- Any valid plan leaves out house 0 or house n−1 (or both). So the answer is the better of:
  the linear robber on `nums[1:]`, and the linear robber on `nums[:-1]`.
- Edge case: with a single house, both slices are empty. Return `nums[0]`.
- See [House Robber](../house-robber/README.md) for the linear version.

## Hints
<details><summary>Hint 1</summary>

What goes wrong if you run the linear solution unchanged? Try `[2, 3, 2]`.
</details>
<details><summary>Hint 2</summary>

Either the first house is left out, or the last house is. Solve each case separately.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`linear(a)` = the two-variable House Robber scan. Return `nums[0]` if `n == 1`, else
`max(linear(nums[1:]), linear(nums[:-1]))`.

Expected complexity: time O(n), space O(1) (walk index ranges instead of slicing).

</details>

## Follow-ups
- Houses in a binary tree (House Robber III).
- Delete-and-earn (LeetCode 740), which reduces to House Robber over values.
