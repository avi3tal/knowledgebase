"""Worked example (BFS shortest path): fewest moves from the top-left to the bottom-right of a maze.

"." is open, "#" is a wall; moves go up/down/left/right. Every move costs 1, so BFS finds the
shortest path: it reaches all cells at distance d before any cell at distance d + 1.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

from collections import deque


def shortest_path(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == "#" or grid[rows - 1][cols - 1] == "#":
        return -1
    seen = {(0, 0)}
    queue = deque([(0, 0)])
    dist = 0
    while queue:
        for _ in range(len(queue)):  # note: one ring = every cell at distance `dist`
            r, c = queue.popleft()
            if (r, c) == (rows - 1, cols - 1):
                return dist  # note: first time we pop the target is the shortest distance — no later ring can beat it
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in seen:
                    seen.add((nr, nc))  # note: mark on enqueue: the first discovery is the shortest one
                    queue.append((nr, nc))
        dist += 1  # note: the whole ring is done; everything left in the queue is one step further
    return -1  # note: the queue emptied without reaching the target: it is walled off
