## How to recognise it

**Strong signals:**
- The input is a `TreeNode` root, or a parent array / edge list with n − 1 edges and no cycles.
- **BST** in the statement → use the ordering: prune, walk one path (search, LCA, floor/ceil), or
  do an in-order walk for sorted output.
- "At **every** node …" (balanced, tilt, subtree sums) → post-order, return a summary.
- "Any path / between any two nodes" → return one thing, record another.
- "Validate", "serialise", "build from traversals" → a clear invariant to carry down or rebuild.

**Look-alikes and how to tell them apart:**
- **Per-level work** (level averages, right-side view, minimum depth, zigzag) → **BFS** with a
  queue. A DFS can do it, but BFS fits the question.
- **Enumerate root-to-leaf paths** with backtracking (paths with sum X, path spells a
  sequence) → the **DFS** lesson; this lesson focuses on BST invariants and return-vs-record.
- **Prefix queries over strings** (autocomplete, starts-with) → **Trie**. It's a tree too, but
  each node has up to 26 children and the path spells a word.
- **k-th largest / smallest in a stream or an unsorted array** → **Top 'K' Elements** (heap).
  Only with an existing BST does the in-order walk win.
- **Connectivity / "are these in the same group"** with edges arriving one at a time →
  **Union-Find** (a forest of parent pointers, not a binary tree you traverse).
- **Search in a sorted array** → **Modified Binary Search**: the same halving idea, but no nodes.

**Complexity:**
- Any full traversal is O(n) time. Space is O(h): O(log n) when balanced, O(n) for a chain.
- BST operations are O(h). Say "O(log n) **if balanced**" in an interview.

**Common pitfalls:**
- Validating a BST by comparing only parent and children. You need ancestor bounds.
- Using `int` min/max as sentinels when node values can equal them. Use `None` or ±infinity.
- Recomputing `height()` from every node: O(n²) on a chain. Return it from the same recursion.
- Forgetting the empty tree (`root is None`) and single-node trees.
- In "return vs record", returning the two-sided value. The parent can't extend a path that
  already bends.
- Python's recursion limit (~1000) on degenerate trees with 10⁴ nodes. Iterate, or raise the limit.
