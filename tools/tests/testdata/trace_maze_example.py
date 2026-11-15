"""Fixture for the maze trace view (shared with studio/src/trace.test.ts via trace_maze_fixture.json)."""

from collections import deque


def bfs(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    seen = {(0, 0)}
    queue = deque([(0, 0, 0)])
    while queue:
        r, c, d = queue.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return d  # note: reached the goal
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc, d + 1))
    return -1
