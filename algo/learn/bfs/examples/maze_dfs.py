"""Worked example (DFS on a maze, for the race against BFS): find A route from the top-left to the
bottom-right with a stack. "." is open, "#" is a wall; moves go up/down/left/right.

DFS always continues from the newest cell, so it dives down one corridor until it hits a dead end.
It finds a route, but nothing makes it the shortest one: that guarantee belongs to BFS.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def maze_dfs(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == "#" or grid[rows - 1][cols - 1] == "#":
        return -1
    parent = {(0, 0): None}  # note: where we came from: the visited set and the route in one dict
    stack = [(0, 0)]
    while stack:
        r, c = stack.pop()  # note: LIFO: continue from the NEWEST cell, so the search dives deep first
        if (r, c) == (rows - 1, cols - 1):
            moves, cell = 0, (r, c)
            while parent[cell] is not None:
                cell, moves = parent[cell], moves + 1
            return moves  # note: DFS reached the goal along A route; count its moves (maybe not the fewest)
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in parent:
                parent[(nr, nc)] = (r, c)
                stack.append((nr, nc))
    return -1  # note: the stack emptied without reaching the target: it is walled off
