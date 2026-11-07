## How to recognise it

**Strong signals:**
- **Groups / components / "same set"** with **transitive** links: a~b and b~c means a~c.
- Links arrive **over time** and you must answer after each one (count groups, are x and y
  connected yet).
- **Undirected** cycle detection on an edge list ("the edge that makes it not a tree").
- **Merge** things that share something: accounts by email, sentences by synonyms, equations
  `a == b`.
- Minimum spanning tree (Kruskal).

**Look-alikes and how to tell them apart:**
- **Static grid, count the islands once** → **Islands** (flood fill with DFS/BFS). Simpler,
  same O(cells). Use union-find when cells are added one by one.
- **Directed** dependencies, cycle detection or ordering (courses, build order) →
  **Topological Sort**. Union-find ignores direction, so it can't see a directed cycle.
- **Shortest path / fewest steps** between two nodes → **BFS** (unweighted) or **Shortest Paths**
  (weighted). Union-find only knows *whether* a path exists, not how long it is.
- **Need the actual path** or the nodes of the cycle → **DFS**, which keeps the path on its
  stack. Union-find forgets how two nodes got connected.
- **Groups split apart** (edge deletions online) → not union-find, unless you can reverse the
  operations offline.

**Complexity:**
- O(α(n)) amortised per operation with path compression + union by rank/size; O(n) space.
- Without either trick: O(n) worst case per find. Say which optimisations you use.

**Common pitfalls:**
- Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`. Parents aren't roots.
- Decrementing the component count on every edge, even when both ends were already joined.
- Forgetting to initialise parents for elements that never appear in any edge (they're
  components too).
- Linking `parent[a] = b` (the nodes) instead of `parent[root_a] = root_b` (the roots).
- Recursion depth: a recursive `find` without compression can hit Python's limit on long chains.
