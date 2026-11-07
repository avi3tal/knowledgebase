# Swim in Rising Water

> Difficulty: **hard** · Patterns: shortest-paths, heap · Sources: [leetcode](https://leetcode.com/problems/swim-in-rising-water/)

## Problem
`grid` is an `n × n` matrix of elevations. At time `t` the water level everywhere is `t`. You can
swim from a cell to a 4-directionally adjacent cell only if **both** elevations are at most `t`;
swimming itself takes no time. Starting at the top-left cell, return the earliest time `t` at
which you can reach the bottom-right cell.

## Examples
- `grid = [[0,2],[1,3]]` → `3`: you can't leave (0,0) before t = 1, and the target has height 3.
- `grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]` → `16`:
  go 0 → 5 along the top row and down, step onto 16, then wind through 15 … 10 and along the
  bottom row 9 … 6. No path avoids a cell of height ≥ 16.
- `grid = [[0]]` → `0`.

## Constraints
- `1 <= n <= 50`, the values are a permutation of `0..n²−1`.
- Trying every `t` with a flood fill is O(n⁴). Aim for O(n² log n).

## Pattern & how to recognise it
- You want the path that minimises the **largest** value along it (a **bottleneck** or
  minimax path), not the sum. Dijkstra still works if a path's cost is `max(cost so far, next
  cell)`, because extending a path can never make that cost smaller.
- Alternatives worth knowing: binary search on `t` + BFS, or union-find, adding cells in
  increasing height until start and end connect.
- Lesson: [Shortest Paths](../../learn/shortest-paths/01-intro.md).

## Learning material
- **Generalised Dijkstra:** any path cost that is **monotone** (never decreases when you extend
  the path) can be minimised with a min-heap of `(cost, cell)`. Sum and max both qualify.
- On a grid, the "graph" is implicit: neighbours are the 4 adjacent cells.
- [Widest / bottleneck path problem (Wikipedia)](https://en.wikipedia.org/wiki/Widest_path_problem)

## Hints
<details><summary>Hint 1</summary>

For a fixed path from start to end, at what time can you swim along it?
</details>
<details><summary>Hint 2</summary>

So you want the path minimising its maximum. Always expand the reachable cell with the lowest
elevation next. What structure gives you that cell?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Min-heap of `(time, r, c)` starting with `(grid[0][0], 0, 0)` and a visited set. Pop the cell
with the smallest time; if it's the target, return its time; otherwise push each unvisited
neighbour with `max(time, grid[nr][nc])`.

Expected complexity: time O(n² log n), space O(n²).

</details>

## Follow-ups
- Path With Minimum Effort: the cost is the largest **difference** between neighbouring cells.
- Solve it with binary search on the answer + BFS, and with union-find. Compare the complexities.
