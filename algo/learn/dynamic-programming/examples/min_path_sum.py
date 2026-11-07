"""Worked example (bottom-up DP): cheapest right/down path through a grid of costs.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def min_path_sum(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    dp = [[0] * cols for _ in range(rows)]  # note: dp[r][c] = cheapest cost to reach (r, c), including grid[r][c]
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:
                dp[r][c] = grid[0][0]  # note: base case: the start costs its own cell
            elif r == 0:
                dp[r][c] = dp[r][c - 1] + grid[r][c]  # note: top row: only reachable from the left
            elif c == 0:
                dp[r][c] = dp[r - 1][c] + grid[r][c]  # note: left column: only reachable from above
            else:
                dp[r][c] = (
                    min(dp[r - 1][c], dp[r][c - 1]) + grid[r][c]
                )  # note: best of the two neighbours already filled (row-major order)
    return dp[rows - 1][cols - 1]  # note: the answer is the last cell
