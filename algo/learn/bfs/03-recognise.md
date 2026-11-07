## How to recognise it

**Strong signals:**
- "**Level by level**", "level order", "row by row", "per depth", "left/right **side view**",
  "**zigzag**".
- "**Minimum** number of steps / moves / minutes / transformations", "**shortest** path",
  "**nearest**", when every step costs the same.
- "Minimum depth" or "the closest leaf": BFS stops at the first hit, while DFS must see everything.
- Several things spread **simultaneously** (infection, fire, rot) → multi-source BFS.

**BFS or DFS?** Both visit every node in O(V + E). Choose by the question:

| | BFS (queue) | DFS (recursion / stack) |
|---|---|---|
| Order | rings: nearest first | one branch to the bottom, then back up |
| Natural for | levels, shortest unweighted path, min depth | paths, root-to-leaf sums, subtree answers, cycles |
| Extra space | O(w): the widest level (n/2 in a full tree) | O(h): the height (log n balanced, n skewed) |

**Anti-signals: it looks similar, but it's a different pattern:**
- Questions about **root-to-leaf paths** (path sum, path with a sequence) or answers built from
  **both subtrees** (height, diameter, balanced?) → **DFS** ([lesson](../dfs/01-intro.md)). BFS loses the path, and a child's
  result isn't ready when the parent is processed.
- **Connected regions in a grid** (count islands, flood fill, area) → **Islands** ([lesson](../islands/01-intro.md)). You can flood
  with BFS, but the pattern is the scan-and-flood loop, and no distances are needed.
- **Weighted** edges (costs, times, prices) → Dijkstra with a min-heap (**Heaps**). Plain BFS
  would return the path with the fewest edges, not the cheapest one.
- **Prerequisites / build order / "can all courses be finished?"** → **Topological Sort**
  (Kahn's algorithm uses a queue too, but it is driven by in-degrees, not distance).
- **Enumerate all** combinations / paths / placements → **Backtracking** (DFS that un-does its
  choices).

**Complexity:**
- Time **O(n)** for a tree, **O(V + E)** for a graph, **O(R·C)** for a grid. Every node is
  enqueued and dequeued once.
- Space **O(w)** for the queue, where w is the widest level. That's up to n/2 for the bottom
  level of a complete tree. Graphs and grids add O(V) for the visited set.

**Common pitfalls:**
- `list.pop(0)` instead of `deque.popleft()`: O(n) per pop.
- Not freezing `len(queue)` before the level loop, which mixes two levels.
- Pushing `None` children (or checking for `None` after the push), which puts empty slots in the
  queue and makes levels look wider than they are.
- Marking visited on **pop** instead of on **push** in graphs and grids: duplicates in the
  queue, and in the worst case exponential blow-up.
- Forgetting the empty input (`root is None`, or a start cell that is a wall).
- Off-by-one distance: decide whether the start counts as step 0 or step 1 (cells on the path
  vs moves made) and stick to it.
