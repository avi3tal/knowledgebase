"""Worked example (DFS post-order): a topological order of a DAG, with cycle detection.

Reference code for the lesson animation; `# note:` comments become the narration.
Edge [u, v] means u must come before v. Returns one valid order, or [] if there is a cycle.
"""


def dfs_topological_order(n: int, edges: list[list[int]]) -> list[int]:
    graph: dict[int, list[int]] = {v: [] for v in range(n)}
    for u, v in edges:
        graph[u].append(v)
    state: dict[int, str] = {}  # missing = unvisited, "active" = on the current path, "done" = finished
    finished: list[int] = []
    has_cycle = False

    def dfs(node: int) -> None:
        nonlocal has_cycle
        state[node] = "active"  # note: enter node — it is on the current DFS path
        for nxt in graph[node]:
            if state.get(nxt) == "active":
                has_cycle = True  # note: edge back into the current path — a cycle
            elif nxt not in state:
                dfs(nxt)
        state[node] = "done"
        finished.append(node)  # note: all descendants are finished — node can finish now (post-order)

    for v in range(n):
        if v not in state:
            dfs(v)  # note: start a DFS from every node not seen yet
    if has_cycle:
        return []
    return finished[::-1]  # note: reverse post-order is a topological order
