## Variant 1: iterative DFS with an explicit stack

Recursion is a stack you don't see. Make it explicit when the tree or graph can be deep (Python
stops at about 1000 frames) or when you want to pause and resume:

```python
stack = [(root, initial_state)]
while stack:
    node, state = stack.pop()            # LIFO: newest first → deep before wide
    visit(node, state)
    if node.right:
        stack.append((node.right, next_state))
    if node.left:
        stack.append((node.left, next_state))   # pushed last, popped first
```

- **Carry per-node state in the stack entry** (`(node, sum_so_far)`, `(node, depth)`). There
  is no frame to hold it any more.
- Push the right child **before** the left one if you want the left subtree first (pre-order).
- Swap the stack for a queue (`deque.popleft`) and the same loop becomes **BFS**. The container
  alone decides the order. See [Breadth-First Search](../bfs/01-intro.md).

The trace below adds up the numbers spelled by every root-to-leaf path, carrying the number built
so far on the stack next to each node.

## Variant 2: answers built bottom-up (post-order)

The parent needs its children's answers first:
- **Height / max depth:** `1 + max(h(left), h(right))`.
- **Same tree / symmetric:** both roots equal **and** both pairs of subtrees equal.
- **Balanced:** return the height, or `-1` as soon as a subtree is unbalanced.
- **Diameter:** each node *sees* a path `h(left) + h(right)` through itself, but *returns*
  only `1 + max(...)` to its parent. Keep the best "seen" value in an outer variable. This
  "return one thing, record another" split is common.
- **Count univalue subtrees:** a node counts if both children are univalue *and* match its value.
  Combine flags from both sides, and don't short-circuit (`and` would skip the right subtree).

## Variant 3: paths with a target

- **Root-to-leaf path sum:** pass `remaining = target - node.val` down, and check it at a
  **leaf**.
- **All such paths:** keep a `path` list and append/pop around the recursion. Copy the list
  (`path[:]`) when you record an answer.
- **Paths that start and end anywhere going downwards (count paths for a sum):** the naive way
  tries every start node, which is O(n²) on a skewed tree. The fast way keeps a map of **prefix
  sums** along the current root-to-node path. Add the current prefix on the way down and
  **remove it on the way back up**, so sums from other branches never leak in.

## Variant 4: DFS on graphs and grids

Same recursion, two changes: the neighbours come from an adjacency list (or the 4 grid
directions), and you need a **visited set**, because graphs have cycles and a tree doesn't.
Mark a node **before** you recurse into its neighbours. Flood fill on a grid is exactly this; see
[Islands (Matrix Traversal)](../islands/01-intro.md). For cycle detection in a directed graph,
use three colours (unvisited / on the current path / finished). Reaching a node that is still on
the path means there's a cycle.
