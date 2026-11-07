## Constraint backtracking: boards and grids

The second family places pieces on a **board** under rules that involve earlier pieces: queens
that can't attack each other, Sudoku digits that can't repeat in a row, column or box, a word
traced through a grid without reusing a cell.

The template is the same, plus **fast lookups for the constraints** so each "is this legal?"
check is O(1) instead of a scan of the board:

```python
def place(row):
    if row == n:
        return True                    # every row filled: solved
    for col in range(n):
        if col in cols or row - col in diag or row + col in anti:
            continue                   # attacked: prune
        board[row][col] = "Q"; cols.add(col); diag.add(row - col); anti.add(row + col)
        if place(row + 1):
            return True                # stop at the first solution and keep the board
        board[row][col] = "."; cols.remove(col); diag.remove(row - col); anti.remove(row + col)
    return False                       # nothing fits in this row: the caller must change its choice
```

- **Encode each constraint as a set (or bitmask)**. Every square on a `\` diagonal has the
  same `row - col`, and every square on a `/` diagonal has the same `row + col`. Sudoku uses
  one set per row, column and 3×3 box.
- **Return a bool to stop early** when you need just one solution. Once `place(row + 1)`
  succeeds, every caller returns `True` without undoing, so the board keeps the solution. To
  *count* or *list* all solutions, record and keep going instead.
- **Choose the order wisely.** Filling row by row means each row needs exactly one queen, which
  already rules out two queens in the same row. In Sudoku, filling the cell with the fewest legal
  digits first prunes much more.

### Paths in a grid

Word search is backtracking on a grid: from a cell, try the 4 neighbours for the next letter.
The "used" mark must be **undone** when you return, because a cell that was a dead end on one
path may be exactly what another path needs. This is the key difference from flood fill
(Islands), where a visited cell stays visited.

The example below places 4 queens on a 4×4 board. The highlighted `try` cell is the square
being tested. Watch the queen in row 0 move from column 0 to column 1 after everything below it
fails. That's the backtrack.
