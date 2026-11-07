"""Worked example (Islands, BFS flood fill): the same count, flooding with a queue.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

from collections import deque


def count_islands_bfs(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    seen = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or (r, c) in seen:
                continue
            count += 1  # note: a new island: start a BFS from this cell
            seen.add((r, c))
            queue = deque([(r, c)])
            while queue:
                cr, cc = queue.popleft()  # note: take the oldest discovered cell: the flood spreads in rings
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in seen:
                        seen.add((nr, nc))  # note: mark when ENQUEUING, so a cell can't be queued twice
                        queue.append((nr, nc))
    return count
