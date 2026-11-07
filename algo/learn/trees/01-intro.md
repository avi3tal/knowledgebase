# Trees

> Fundamental · Data structures: binary tree, binary search tree (BST)

A **tree** is a connected graph with no cycles: n nodes, n − 1 edges, exactly one path between any
two nodes. In interviews it is almost always a **rooted binary tree**: every node has a value and
at most two children, `left` and `right`.

```
            10            depth 0   ← root
          /    \
         5      15        depth 1
        / \    /  \
       3   7  13   18     depth 2
      /   /
     1   6                depth 3   ← leaves: 1, 6, 13, 18
```

Vocabulary that shows up in problem statements:
- **Height** of a node: nodes on the longest path down to a leaf (`1 + max(h(left), h(right))`).
- **Depth**: distance from the root. **Leaf**: no children. **Subtree**: a node plus everything
  below it.
- **Balanced**: at every node the two subtree heights differ by at most 1, so h = O(log n).
  A **degenerate** tree is a chain, so h = n. Recursion depth is O(h), and that is your space cost.

kb serialises trees **level by level** with `null` for missing children, like LeetCode:
`[10, 5, 15, 3, 7, 13, 18, 1, null, 6]` is the tree above.

## Four traversal orders

| Order | Visit | Typical use |
|---|---|---|
| **Pre-order** | node, left, right | copy / serialise a tree, pass state *down* (depth, path so far, bounds) |
| **In-order** | left, node, right | on a **BST** this yields values in **sorted order** |
| **Post-order** | left, right, node | combine children's answers *up* (height, subtree sums, balance) |
| **Level-order** | level by level (queue) | anything per level, shortest depth → see **BFS** |

All four touch every node once: **O(n) time**. Recursive versions use **O(h)** stack space;
level-order uses O(width) for the queue.

## Binary search trees

A **BST** adds one invariant: for every node, **all** keys in its left subtree are smaller and
**all** keys in its right subtree are larger. "All" matters. It's a statement about whole
subtrees, not just a parent and its two children.

| Operation | Balanced BST | Degenerate BST |
|---|---|---|
| search / insert / delete | O(log n) | O(n) |
| min / max (walk left / right) | O(log n) | O(n) |
| in-order (sorted) iteration | O(n) total | O(n) total |

The ordering lets you **prune**: if the node's key is smaller than everything you're looking for,
its whole left subtree can be skipped. That turns "visit all n nodes" into "visit one path" or
"visit only the part of the tree in range".

## Template: iterative DFS with pruning

```python
total, stack = 0, [root] if root else []
while stack:
    node = stack.pop()
    <use node>
    if node.left and <left side can still matter>:   # BST: node.val > low
        stack.append(node.left)
    if node.right and <right side can still matter>: # BST: node.val < high
        stack.append(node.right)
```

Below: the sum of all keys in `[low, high]`. Watch which subtrees never enter the stack. When
`node.val` is already below `low`, nothing on its left can be in range.
