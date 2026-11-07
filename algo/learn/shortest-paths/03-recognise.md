## How to recognise it

**Strong signals:**
- A graph (explicit edges, or a grid / state space) whose edges have **costs**: time, price,
  distance, effort.
- "Minimum total cost / time / effort to get from A to B", "how long until everyone receives the
  signal".
- A **constraint on the route** (at most k stops, limited fuel) → Bellman-Ford rounds, or
  Dijkstra over `(node, state)`.
- Minimise the **worst** step on the route (bottleneck) → Dijkstra with `max`.

**Look-alikes and how to tell them apart:**
- **All moves cost the same** (fewest steps, knight moves, word ladder) → **BFS**. A heap
  only adds a log factor.
- **Are A and B connected at all** / count groups → **Union-Find** or a DFS. No distances needed.
- **Connect everything** at minimum total cost → minimum spanning tree (Kruskal with
  **Union-Find**, or Prim). That's not a shortest path: the MST can make A→B long.
- **Ordering with dependencies**, longest/critical path in a DAG → **Topological Sort**
  (then a DP in that order).
- A grid where you can only move **right/down** → **Dynamic Programming** (no cycles, so no
  heap needed).

**Complexity:**
- Dijkstra with a binary heap: O((V + E) log V) time, O(V + E) space.
- Bellman-Ford: O(V · E), or O(k · E) for k rounds. 0-1 BFS / BFS: O(V + E).

**Common pitfalls:**
- Dijkstra with **negative** weights: a finalised node can later get cheaper. Use Bellman-Ford.
- Marking a node visited when it's **pushed** instead of when it's **popped**. A cheaper route
  found later would then be ignored.
- Forgetting the stale-entry check: correct but slower, and wrong if you process side effects twice.
- "At most k stops" with plain Dijkstra and a `visited` set: the cheapest route to a mid node may
  use too many stops.
- In Bellman-Ford with an edge limit, updating `dist` in place lets one round use several edges.
