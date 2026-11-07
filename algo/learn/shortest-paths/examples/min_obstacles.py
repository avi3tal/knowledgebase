"""Worked example (0-1 BFS): fewest obstacles to remove to walk from the top-left to the bottom-right.

grid[r][c] == 1 is an obstacle (entering it costs 1 removal); 0 is free.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

from collections import deque


def min_obstacles(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    dist = [[float("inf")] * cols for _ in range(rows)]
    dist[0][0] = 0
    queue = deque([(0, 0)])  # note: a deque kept in distance order — front = cheapest
    while queue:
        r, c = queue.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and dist[r][c] + grid[nr][nc] < dist[nr][nc]:
                dist[nr][nc] = dist[r][c] + grid[nr][nc]
                if grid[nr][nc] == 0:
                    queue.appendleft((nr, nc))  # note: free step (cost 0) — goes to the FRONT
                else:
                    queue.append((nr, nc))  # note: obstacle (cost 1) — goes to the BACK
    return dist[rows - 1][cols - 1]
