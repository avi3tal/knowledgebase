"""Worked example (top-down DP): number of right/down paths from the top-left to cell (r, c).

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def unique_paths(rows: int, cols: int) -> int:
    memo: dict[tuple[int, int], int] = {}  # note: memo[(r, c)] = number of paths from (0, 0) to (r, c)

    def paths(r: int, c: int) -> int:
        if r == 0 or c == 0:
            return 1  # note: base case: on the top row or left column there is exactly one straight path
        if (r, c) in memo:
            return memo[(r, c)]  # note: cache hit — this subproblem was already solved on another branch
        memo[(r, c)] = paths(r - 1, c) + paths(
            r, c - 1
        )  # note: the last move came from above or from the left: add both
        return memo[(r, c)]

    return paths(rows - 1, cols - 1)  # note: each of the rows × cols states is solved once → O(rows · cols)
