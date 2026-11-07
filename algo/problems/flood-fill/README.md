# Flood Fill

> Difficulty: **easy** · Patterns: islands, dfs · Sources: [leetcode](https://leetcode.com/problems/flood-fill/)

## Problem
An image is an `m × n` grid of integers, one colour per pixel. Starting from pixel `(sr, sc)`,
repaint it and every pixel connected to it **horizontally or vertically** through pixels of the
**same original colour** with `color`. Return the image. This is the "paint bucket" tool.

## Examples
- `image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2` → `[[2,2,2],[2,2,0],[2,0,1]]`.
  The bottom-right `1` touches the region only diagonally, so it keeps its colour.
- `image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0` → unchanged. The new colour equals the old one.
- `image = [[1,0],[0,1]], sr = 0, sc = 0, color = 3` → `[[3,0],[0,1]]`.

## Constraints
- `1 <= m, n <= 50`, `0 <= image[i][j], color < 2^16`, `(sr, sc)` is inside the image.
- Target: O(m·n) time and space, linear in the number of pixels.

## Pattern & how to recognise it
- "Repaint every **connected** pixel of the same colour" is a **flood fill**: one connected
  component of a grid, explored with DFS or BFS.
- You only need the component that contains the start, so there's no outer scan loop. This is the
  smallest version of the Islands pattern.
- Lesson: [Islands (Matrix Traversal)](../../learn/islands/01-intro.md).

## Learning material
- A grid is a graph: each cell has edges to its 4 neighbours. A flood fill is a DFS/BFS that
  only follows edges into cells with the original colour.
- Painting a cell can double as marking it visited, *unless* the new colour equals the old one.
  Then the painted cells still look unvisited, and the search never stops.
- [Flood fill (Wikipedia)](https://en.wikipedia.org/wiki/Flood_fill)

## Hints
<details><summary>Hint 1</summary>

Remember the original colour of the start pixel before you change anything.
</details>
<details><summary>Hint 2</summary>

From a pixel, which of its 4 neighbours should the paint spread into? What should happen if the
new colour is the same as the original one?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`old = image[sr][sc]`. If `old == color`, return the image unchanged. Otherwise run DFS (or BFS)
from `(sr, sc)`: paint the cell, then recurse into each in-bounds neighbour whose colour is still
`old`. Each pixel is painted at most once. Time O(m·n), space O(m·n) for the recursion stack or
queue in the worst case.
</details>

## Follow-ups
- 8-directional connectivity.
- Return the number of pixels repainted, or the region's perimeter.
- Number of Islands (LeetCode 200): repeat the flood from every unvisited cell and count.
