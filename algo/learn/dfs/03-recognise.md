## How to recognise it

**Strong signals:**
- "**Root-to-leaf** path", "path sum", "path with the given sequence", "all paths".
- The answer for a node depends on the answers for its **children**: height, diameter,
  balanced, same / symmetric / subtree, lowest common ancestor, count of subtrees with some property.
- **Traversal order** by name: pre-order, in-order (sorted order in a BST), post-order.
- "**Explore** everything reachable", "**connected** components", "is there **a** path" (any path,
  not the shortest) in a graph or grid.
- **Cycle** detection in a graph.

**Anti-signals: it looks similar, but it's a different pattern:**
- "**Level**", "row", "side view", "zigzag", "**minimum** depth", "**fewest** moves", "nearest"
  → **BFS**. DFS can find a path, but not the *shortest* one without exploring everything.
- Generate **all combinations / permutations / subsets** or fill a board under constraints →
  **Backtracking** (or **Subsets**). It is DFS on a decision tree that is never stored, and the
  focus is on pruning choices, not on visiting a given structure.
- **Overlapping subproblems** (the same state is reached by many paths, e.g. counting grid
  paths, coin change) → **Dynamic Programming**. Plain DFS recomputes them exponentially.
  Memoised DFS *is* top-down DP.
- **Connected regions in a matrix** (count islands, flood fill, area) → **Islands**. The flood
  is a DFS, but the scan-every-cell loop and the grid boundary handling are what the pattern is about.
- Plain **recursion** on numbers or arrays (factorial, power, Hanoi) isn't DFS. Nothing is being
  traversed.

**Complexity:**
- Time **O(n)** for a tree (each node visited once), **O(V + E)** for a graph, **O(R·C)** for a grid.
- Space **O(h)** for the recursion or explicit stack: O(log n) on a balanced tree, O(n) on a
  skewed one. Graphs add O(V) for the visited set. A `path` list is also O(h).

**Common pitfalls:**
- **Leaf vs `None`.** `if node is None: return target == 0` wrongly accepts a node that has one
  child as the end of a path. Check `node.left is None and node.right is None`.
- **Forgetting to un-choose.** If you append to a shared `path` (or add to a prefix-sum map), you
  must pop / decrement on the way back, or later branches see stale entries.
- **Recording the live list.** `result.append(path)` stores a reference that keeps changing. Store
  `path[:]` / `list(path)`.
- **Short-circuiting** `and` / `or` when both sides must run (counting problems).
- **Return one thing, record another** (diameter, max path sum): the value that's best at this
  node is not always the value the parent needs.
- **Visited set** in graphs: mark on entry, or a cycle recurses forever.
- **Recursion depth** in Python on skewed trees / big grids: switch to an explicit stack.
