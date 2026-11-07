# Word Search

> Difficulty: **medium** · Patterns: backtracking, dfs · Sources: [leetcode](https://leetcode.com/problems/word-search/)

## Problem
Given an `m x n` grid of characters `board` (each row is a string) and a string `word`, return
`true` if `word` can be spelled by a path of horizontally or vertically **adjacent** cells. The
same cell may not be used more than once in one word.

## Examples
- `board = ["ABCE","SFCS","ADEE"]`, `word = "ABCCED"` → `true`
- same board, `word = "SEE"` → `true`
- same board, `word = "ABCB"` → `false` (the only `B` next to the second `C` is already used)

## Constraints
- `1 <= m, n <= 6`, `1 <= len(word) <= 15`, uppercase and lowercase English letters.

## Pattern & how to recognise it
- Find **one path** that matches a sequence, where cells can't be reused **within the path** →
  **Backtracking** on the grid: mark the cell, explore the 4 neighbours, unmark it on the way
  back.
- Looks like **Islands** (grid DFS), but there a cell visited once stays visited forever. Here
  the mark must be **undone**, because a cell that failed on one path may be needed by another.
- Lesson: [Backtracking](../../learn/backtracking/01-intro.md).

## Learning material
- `dfs(r, c, i)`: does `word[i:]` start at cell `(r, c)`? Fail fast if out of bounds, already
  on the path, or `board[r][c] != word[i]`.
- Mark the cell as used before exploring its neighbours and unmark it afterwards (a visited set
  you add to and remove from, or a temporary sentinel character).
- [LeetCode 79](https://leetcode.com/problems/word-search/).

## Hints
<details><summary>Hint 1</summary>

Try every cell as the starting point of the word.
</details>
<details><summary>Hint 2</summary>

Why does a global "visited" set that you never clear give wrong answers?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

For every cell, run `dfs(r, c, 0)`. In `dfs`: if `i == len(word)` return true; if out of bounds,
on the path, or `board[r][c] != word[i]`, return false. Add `(r, c)` to the path, return true if
any neighbour `dfs(nr, nc, i + 1)` succeeds, and remove `(r, c)` before returning false.
Time O(m · n · 3^L): after the first step each cell has at most 3 unvisited neighbours.
Space O(L) for the recursion.
</details>

## Follow-ups
- Word Search II (LeetCode 212): many words at once, with a trie.
- Prune early: if the board doesn't contain enough of some letter, return false immediately.
