"""Worked example (Islands, DFS flood fill): count the islands in a grid of "1" land / "0" water.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def count_islands(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    seen = set()  # note: the visited set: every land cell we have already sunk
    count = 0

    def sink(r: int, c: int) -> None:
        seen.add((r, c))  # note: mark BEFORE exploring, so no neighbour can send us back here
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in seen:
                sink(nr, nc)  # note: dive into an unvisited land neighbour (up/down/left/right only)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1  # note: unvisited land = the first cell of a NEW island
                sink(r, c)  # note: flood the whole island so the scan never counts it again
    return count  # note: one flood per island; each cell is visited O(1) times → O(R·C)
