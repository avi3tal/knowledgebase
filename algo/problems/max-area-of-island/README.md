# Max Area of Island

> Difficulty: **medium** · Patterns: islands, dfs · Sources: [leetcode](https://leetcode.com/problems/max-area-of-island/)

## Problem
Given an `m × n` binary grid where `1` is land and `0` is water, an **island** is a group of `1`s
connected **horizontally or vertically**. The area of an island is its number of cells. Return
the **largest** area, or `0` if there is no land.

## Examples
- The 8 × 13 grid from LeetCode (see `cases.json`, "example 1") → `6`.
- `[[0,0,0,0,0,0,0,0]]` → `0`.
- `[[1,0,1],[0,1,0],[1,0,1]]` → `1`. Diagonal cells are not connected.

## Constraints
- `1 <= m, n <= 50`, `grid[i][j]` is `0` or `1`.
- Target: O(m·n) time and space, linear in the number of cells.

## Pattern & how to recognise it
- "Island" = a **connected region** of equal cells in a grid. Scan every cell and flood each new
  island once. That's the **Islands** pattern.
- The flood visits every cell of the island anyway, so measure it while you go.
- Lesson: [Islands (Matrix Traversal)](../../learn/islands/01-intro.md), especially
  [measuring each region](../../learn/islands/02-variants.md).

## Learning material
- Scan-and-flood: each cell is visited by the scan once and flooded at most once → O(m·n).
- A DFS can **return** a value: the area of the part of the island it explored.
- Recursion depth: an all-land 50 × 50 grid can make a DFS 2,500 frames deep, above Python's
  default limit of 1000. Use BFS or an explicit stack for big grids.
- [Connected component (Wikipedia)](https://en.wikipedia.org/wiki/Component_(graph_theory))

## Hints
<details><summary>Hint 1</summary>

How do you make sure you never count the same island (or the same cell) twice?
</details>
<details><summary>Hint 2</summary>

What should a flood started at one cell return, so that the caller learns the island's size?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For every cell that is `1` and not yet visited, flood it with DFS: mark the cell, then return
`1 + ` the sum of the floods of its unvisited land neighbours. Keep the maximum over all floods.
Time O(m·n), space O(m·n).
</details>

## Follow-ups
- Number of Islands (LeetCode 200), Island Perimeter (LeetCode 463).
- Making a Large Island (LeetCode 827): flip at most one `0` to `1`. Label islands with their
  sizes first.
- Number of Distinct Islands (LeetCode 694).
