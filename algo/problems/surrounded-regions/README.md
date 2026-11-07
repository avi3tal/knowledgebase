# Surrounded Regions

> Difficulty: **medium** · Patterns: islands, dfs · Sources: [leetcode](https://leetcode.com/problems/surrounded-regions/)

## Problem
A board of `'X'` and `'O'` is given as a list of strings (one per row). A region of `'O'`s
connected **horizontally or vertically** is **captured** if none of its cells is on the border
of the board. Replace every `'O'` in a captured region with `'X'` and return the resulting board.
(LeetCode modifies a `char[][]` in place. Strings are immutable, so here you return a new list
of strings.)

## Examples
- `["XXXX","XOOX","XXOX","XOXX"]` → `["XXXX","XXXX","XXXX","XOXX"]`. The bottom `O` is on the
  border, so it stays.
- `["X"]` → `["X"]`.
- `["XXXX","XXOX","XOXX","OXXX"]` → `["XXXX","XXXX","XXXX","OXXX"]`. Touching the border `O`
  diagonally does not count.

## Constraints
- `1 <= m, n <= 200`, every character is `'X'` or `'O'`.
- Target: O(m·n) time and space, linear in the number of cells.

## Pattern & how to recognise it
- Regions of `'O'` that **do or don't reach the border** → the border variant of the
  **Islands** pattern.
- Flooding from every inner `'O'` and checking whether you hit the edge works, but it's messy.
  You have to remember the result for the whole region, or you redo the flood for every cell.
- Lesson: [Islands (Matrix Traversal)](../../learn/islands/01-intro.md), especially
  [start from the border](../../learn/islands/02-variants.md).

## Learning material
- Turn the question around: which `'O'`s can **escape**? Everything connected to a border `'O'`
  can. Everything else is captured.
- Use a `seen` set (or a list of lists you build from the strings) because Python strings and Go
  strings can't be changed in place.
- [Flood fill (Wikipedia)](https://en.wikipedia.org/wiki/Flood_fill)

## Hints
<details><summary>Hint 1</summary>

Which `'O'`s can you be **sure** are not captured, before looking at anything else?
</details>
<details><summary>Hint 2</summary>

Start the flood from those cells. What does the flood tell you about every other `'O'`?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Flood (DFS or BFS) from every `'O'` on the four borders, marking reached cells as safe. Then
build the answer: a cell is `'O'` if it was marked safe, otherwise `'X'`. Time O(m·n), space
O(m·n). Use BFS or an explicit stack on large boards to avoid deep recursion.
</details>

## Follow-ups
- Number of Closed Islands (LeetCode 1254), Number of Enclaves (LeetCode 1020).
- Pacific Atlantic Water Flow (LeetCode 417): flood from two borders and intersect.
