# BFS of a Graph

> Difficulty: **easy** · Patterns: graph-bfs · Sources: [educative](https://www.educative.io/courses/data-structures-coding-interviews-python)

## Problem
A directed graph with `n` nodes `0..n-1` is given as an adjacency list: `graph[i]` lists the
nodes that `i` has edges to. Starting from `start`, return the nodes in **breadth-first order**.
Visit each reachable node exactly once, and explore each node's neighbours **in the order they
appear in `graph[i]`**, so the answer is unique. Nodes not reachable from `start` are not
included.

## Examples
- `graph = [[1,2],[3,4],[5],[],[5],[]]`, `start = 0` → `[0,1,2,3,4,5]`. This is the course's
  A..F example, with A=0 … F=5.
- `graph = [[1],[2],[0]]`, `start = 0` → `[0,1,2]`: the cycle back to 0 is ignored.
- `graph = [[3,1,2],[4],[4],[],[0]]`, `start = 0` → `[0,3,1,2,4]`.

## Constraints
- `1 <= n <= 10^4`, `0 <= start < n`, up to `10^5` edges; self-loops and duplicate edges may appear.
- Target: O(V + E) time, O(V) extra space.

## Pattern & how to recognise it
- **Explore "nearest first", shortest path in an unweighted graph, levels/layers** → **BFS with a
  FIFO queue and a visited set**.
- Mark a node visited **when you enqueue it**, not when you dequeue it. Otherwise a node can sit
  in the queue several times.
- See [algo/notes/graphs.md](../../notes/graphs.md) and the reference code in
  [algo/ds/graph/python](../../ds/graph/python).

## Learning material
- **Template:** `seen = {start}; q = deque([start])`. While `q` is non-empty: `u = q.popleft()`,
  record `u`, and for each `v` in `graph[u]` that isn't in `seen`, add it to `seen` and to the queue.
- **Cost:** each node is enqueued once, and each edge is examined once: O(V + E). This only holds if
  queue operations are O(1). Python's `list.pop(0)` is O(n), which makes BFS O(V²). Use
  `collections.deque`.
- **BFS gives shortest paths in an unweighted graph:** record `dist[v] = dist[u] + 1` (or the
  parent) when you enqueue `v`.
- Representations: adjacency list (O(V + E) space, the usual choice) vs adjacency matrix (O(V²)).
- [Breadth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Breadth-first_search)

## Hints
<details><summary>Hint 1</summary>

Which data structure hands nodes back in the order you discovered them?
</details>
<details><summary>Hint 2</summary>

How do you make sure a node reachable along two paths is only visited once?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Use a deque and a visited set, both seeded with `start`. Pop from the left, append to the result,
and enqueue the unvisited neighbours in list order, marking them visited as they're enqueued.
Time O(V + E), space O(V).
</details>

## Follow-ups
- Shortest path length / path reconstruction in an unweighted graph (store the parents).
- Multi-source BFS: Rotting Oranges (LeetCode 994), Walls and Gates.
- BFS on a grid: Number of Islands (LeetCode 200), Shortest Path in Binary Matrix (LeetCode 1091).
- Bipartite check (LeetCode 785): 2-colour while running BFS.
- [DFS of a Graph](../dfs-of-graph/README.md): the same exploration with a stack or recursion.
