# Rotting Oranges

> Difficulty: **medium** · Patterns: islands, bfs · Sources: [leetcode](https://leetcode.com/problems/rotting-oranges/)

## Problem
Each cell of an `m × n` grid is `0` (empty), `1` (fresh orange) or `2` (rotten orange). Every
minute, each fresh orange that is **horizontally or vertically** next to a rotten one becomes
rotten. Return the minimum number of minutes until no fresh orange is left, or `-1` if that never
happens.

## Examples
- `[[2,1,1],[1,1,0],[0,1,1]]` → `4`.
- `[[2,1,1],[0,1,1],[1,0,1]]` → `-1`. The bottom-left orange is cut off.
- `[[0,2]]` → `0`. There's no fresh orange to begin with.

## Constraints
- `1 <= m, n <= 10`, `grid[i][j]` is `0`, `1` or `2`.
- Target: O(m·n) time and space, linear in the number of cells.

## Pattern & how to recognise it
- Spreading on a grid **one step per minute** from **several starting cells at once** →
  **multi-source BFS**. All rotten oranges are the sources at minute 0, and each BFS ring is one
  minute.
- Simulating the grid minute by minute re-scans every cell each minute: O((m·n)²).
- Lessons: [Islands (Matrix Traversal)](../../learn/islands/01-intro.md) (multi-source BFS is in
  [its variants](../../learn/islands/02-variants.md)) and
  [Breadth-First Search](../../learn/bfs/01-intro.md).

## Learning material
- BFS processes nodes in rings of equal distance from the sources. With all sources queued
  first, a cell's ring number is its distance to the **nearest** source.
- Level-by-level BFS: freeze `len(queue)` at the start of each round. One round = one minute.
- [Breadth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Breadth-first_search)

## Hints
<details><summary>Hint 1</summary>

What goes into the queue before the first minute starts? (More than one cell.)
</details>
<details><summary>Hint 2</summary>

How do you know at the end whether some fresh orange was never reached?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Queue every rotten orange and count the fresh ones. While the queue is non-empty and fresh
oranges remain, process one level: for each popped cell, rot each fresh neighbour, decrement the
fresh count and enqueue it. After each level, `minutes += 1`. Return `minutes` if the fresh
count is 0, else `-1`. Time O(m·n), space O(m·n).
</details>

## Follow-ups
- 01 Matrix (LeetCode 542): distance from each cell to the nearest 0.
- Walls and Gates (LeetCode 286).
- As Far from Land as Possible (LeetCode 1162).
