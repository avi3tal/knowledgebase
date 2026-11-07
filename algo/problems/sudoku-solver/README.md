# Sudoku Solver

> Difficulty: **hard** · Patterns: backtracking · Sources: [leetcode](https://leetcode.com/problems/sudoku-solver/)

## Problem
Fill the empty cells of a 9 × 9 Sudoku `board` **in place**. Each cell is a one-character
string: a digit `"1"`–`"9"` or `"."` for empty. A solution puts each digit 1–9 exactly once in
every row, every column and every 3 × 3 box. The given puzzle has exactly one solution.

## Examples
- The LeetCode example: the top row `"53..7...."` becomes `"534678912"`, and so on for all
  nine rows. See `cases.json` for full boards.
- A board with one empty cell: that cell gets the only digit missing from its row.

## Constraints
- `board` is 9 × 9, every cell is a digit or `"."`, and the puzzle has exactly one solution.

## Pattern & how to recognise it
- Fill positions one at a time, where each choice must satisfy **constraints** with the choices
  already made, and a dead end means undoing earlier choices → **Backtracking**.
- It's a constraint-satisfaction search like N-Queens. Without pruning, the 9^(empty cells)
  search space is hopeless. Checking row, column and box before placing a digit cuts it down to
  something that runs in milliseconds.
- Lesson: [Backtracking — constraints](../../learn/backtracking/02-constraints.md).

## Learning material
- Keep three lookups of the digits already used: `rows[r]`, `cols[c]` and `boxes[(r // 3) * 3 +
  c // 3]` (sets or 9-bit masks). A digit is legal at `(r, c)` if it's in none of them.
- Recurse over the empty cells. Place a legal digit, update the three lookups, recurse; if the
  recursion fails, remove it again.
- Better pruning: pick the empty cell with the **fewest** legal digits next.
- [LeetCode 37](https://leetcode.com/problems/sudoku-solver/).

## Hints
<details><summary>Hint 1</summary>

How do you check in O(1) whether digit `d` can go at `(r, c)`?
</details>
<details><summary>Hint 2</summary>

Make your recursive function return `true` once the board is full, so the callers stop and keep
their digits instead of undoing them.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Collect the empty cells and fill the `rows`, `cols` and `boxes` sets from the given digits.
`solve(k)`: if `k == len(empties)`, return true. For the `k`-th empty cell, try each digit not in
its row, column or box: write it into the board, add it to the three sets, and return true if
`solve(k + 1)` does; otherwise undo all four changes. Return false after the last digit.
Time O(9^e) in the worst case for `e` empty cells (far less in practice with pruning). Space
O(e) for the recursion.
</details>

## Follow-ups
- Valid Sudoku (LeetCode 36): only validate a partial board.
- Count the solutions, or prove there's exactly one.
- Dancing Links (Knuth's Algorithm X) for exact-cover puzzles.
