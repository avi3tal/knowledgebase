# Breadth-First Search

> Pattern #8 · Data structures: queue (FIFO), tree, graph, matrix

Some questions are about **distance from a starting point**. Which nodes are on level 3 of the
tree? What is the shallowest leaf? How many moves does the knight need? How many minutes until
the whole grid is rotten? You could explore paths one at a time and keep the best, but a
depth-first search can wander far down one branch before it finds a short path in another.

**The insight:** explore in **rings**. Visit the start, then everything 1 step away, then
everything 2 steps away, and so on. A **FIFO queue** produces this order without extra effort:
nodes leave in the order they were discovered, and a node's neighbours are discovered one ring
after it. So:
- in a **tree**, BFS is **level-order traversal**;
- in an **unweighted graph or grid**, the first time BFS reaches a node is along a **shortest
  path** (fewest edges).

```figure
level-queue
```

When you pop a node you push its children **at the back**. They wait until the whole current
level has left the queue, so levels never mix.

## The template (level by level)

```python
from collections import deque

def bfs_levels(root):
    if root is None:
        return []
    levels = []
    queue = deque([root])
    while queue:
        size = len(queue)               # the current level is exactly these nodes
        level = []
        for _ in range(size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        levels.append(level)            # one full level done
    return levels
```

- **Freeze `size = len(queue)` before the inner loop.** The queue grows while you process the
  level. The frozen count tells you where this level ends and the next begins.
- Use `collections.deque`. `list.pop(0)` shifts every element, which turns O(n) into O(n²).
  In Go, use a slice and a head index (or reslice `q = q[1:]`).
- If you don't need level boundaries, drop the inner loop: pop, visit, push children.

Step through it below on the tree from the sketch. The tree view highlights the nodes in the
queue. Watch each level enter the queue while the previous level drains out, and how `size` marks
the boundary.
