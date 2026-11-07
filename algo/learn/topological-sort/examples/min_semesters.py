"""Worked example (Kahn's algorithm, level by level): minimum number of semesters.

Reference code for the lesson animation; `# note:` comments become the narration.
Course u must be taken before course v for every edge [u, v]. Any number of courses may be
taken in one semester. Return the number of semesters, or -1 if the prerequisites form a cycle.
"""

from collections import deque


def min_semesters(n: int, edges: list[list[int]]) -> int:
    graph: dict[int, list[int]] = {v: [] for v in range(n)}
    in_degree: dict[int, int] = {v: 0 for v in range(n)}
    for u, v in edges:
        graph[u].append(v)  # note: build the adjacency list — u unlocks v
        in_degree[v] += 1  # note: v has one more prerequisite
    queue = deque(v for v in range(n) if in_degree[v] == 0)  # note: sources — no prerequisites at all
    order: list[int] = []
    semesters = 0
    while queue:
        semesters += 1  # note: everything in the queue right now can be taken this semester
        for _ in range(len(queue)):
            node = queue.popleft()
            order.append(node)  # note: take the course — it joins the topological order
            for nxt in graph[node]:
                in_degree[nxt] -= 1  # note: one prerequisite of nxt is done
                if in_degree[nxt] == 0:
                    queue.append(nxt)  # note: all prerequisites done — nxt is ready next semester
    if len(order) < n:
        return -1  # note: some courses never reached in-degree 0 — they sit on a cycle
    return semesters
