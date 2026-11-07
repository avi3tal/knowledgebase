# Number of Islands II

> Difficulty: **hard** · Patterns: union-find, islands · Sources: [leetcode](https://leetcode.com/problems/number-of-islands-ii/)

## Problem
An `m × n` map starts as all water. You get a list of `positions`; the k-th one `[r, c]` turns
that cell into land. After **each** operation, report the number of islands, where an island is
a group of land cells connected horizontally or vertically. A position may repeat (turning land
into land changes nothing). Return the list of counts.

## Examples
- `m = 3, n = 3, positions = [[0,0],[0,1],[1,2],[2,1]]` → `[1, 1, 2, 3]`.
- `m = 3, n = 3, positions = [[0,1],[1,0],[1,2],[2,1],[1,1]]` → `[1, 2, 3, 4, 1]`: the last
  cell joins four islands into one.

## Constraints
- `1 <= m, n`, `m · n <= 10^4`, `0 <= positions.length <= 10^4`.
- Re-running a flood fill after each operation is O(k · m · n). Aim for O(m · n + k · α(m·n)).

## Pattern & how to recognise it
- The grid looks like the **Islands** pattern, but the question is asked **after every change**
  → incremental connectivity → **union-find**.
- Each new land cell adds one island, then merges with each distinct neighbouring island
  (each successful union subtracts one).
- Lessons: [Union-Find](../../learn/union-find/01-intro.md), [Islands](../../learn/islands/01-intro.md).

## Learning material
- Map cell `(r, c)` to index `r * n + c` so a flat `parent` array covers the grid.
- Only land cells take part. Track which cells are land (a set, or `parent[i] = -1` for water).
- A union that finds two different roots merges two islands; one that finds the same root
  (two neighbours already in one island) changes nothing.
- [Disjoint-set data structure (Wikipedia)](https://en.wikipedia.org/wiki/Disjoint-set_data_structure)

## Hints
<details><summary>Hint 1</summary>

What happens to the count when a new land cell has no land neighbours? When it touches two cells
that belong to the same island?
</details>
<details><summary>Hint 2</summary>

Flatten the grid so each cell is one union-find element. When is a repeated position a no-op?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Keep `parent` over `m·n` cells, a land set and a `count`. For each position: if it's already
land, append `count`; otherwise mark it, `count += 1`, and for each of the 4 neighbours that is
land, `union` (decrementing `count` when the roots differ). Append `count`.

Expected complexity: time O(m·n + k·α(m·n)), space O(m·n).

</details>

## Follow-ups
- Also support turning land back into water (union-find can't split; think offline, in reverse).
- Report the size of the largest island after each step.
