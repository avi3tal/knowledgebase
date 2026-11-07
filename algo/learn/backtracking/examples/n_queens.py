"""Worked example (constraint backtracking on a board): the first way to place n queens.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def first_n_queens(n: int) -> list[str]:
    board = [["."] * n for _ in range(n)]
    cols: set[int] = set()
    diagonals: set[int] = set()  # row - col is constant along a "\" diagonal
    anti_diagonals: set[int] = set()  # row + col is constant along a "/" diagonal

    def place(row: int) -> bool:
        if row == n:
            return True  # note: every row has a queen — solved
        for col in range(n):
            if col in cols or row - col in diagonals or row + col in anti_diagonals:
                continue  # note: attacked — skip this square
            board[row][col] = "Q"  # note: choose — put a queen here and claim its column and diagonals
            cols.add(col)
            diagonals.add(row - col)
            anti_diagonals.add(row + col)
            if place(row + 1):
                return True
            board[row][col] = "."  # note: dead end below — un-choose and try the next column
            cols.remove(col)
            diagonals.remove(row - col)
            anti_diagonals.remove(row + col)
        return False  # note: no column works in this row — backtrack to the row above

    if not place(0):
        return []
    return ["".join(r) for r in board]
