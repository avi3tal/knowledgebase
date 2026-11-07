## Variant 1: what you do with each level

Most tree-BFS questions use the template unchanged and only differ in what they record per
level:
- **Level lists / averages / max per level:** collect or fold the values inside the inner loop.
- **Right side view:** the **last** node popped in each level. Left view: the first.
- **Zigzag:** collect the level normally, then reverse every other one (or use a deque and
  append on alternating sides).
- **Minimum depth:** return the level number of the **first leaf** you pop. BFS can stop early.
  DFS has to explore the whole tree to be sure nothing shallower exists.
- **Connect level-order siblings:** link each popped node to the next one in the same level.
- **Bottom-up order:** build the levels top-down, then reverse the list.

## Variant 2: shortest path in an unweighted graph or grid

Same queue, different neighbours. In a graph they come from the adjacency list. In a grid they
are the 4 neighbouring cells. Two changes compared with a tree:

```python
seen = {start}                       # graphs and grids have cycles: remember visited nodes
queue = deque([start])
dist = 0
while queue:
    for _ in range(len(queue)):      # one ring = all nodes at distance `dist`
        node = queue.popleft()
        if node == target:
            return dist
        for nxt in neighbours(node):
            if nxt not in seen:
                seen.add(nxt)        # mark when ENQUEUING
                queue.append(nxt)
    dist += 1
return -1
```

1. **A visited set.** A tree has exactly one path to each node, but a graph or grid can reach a
   node in many ways. Without `seen` you go round in circles.
2. **Mark on enqueue.** The first time a node is *discovered* is already along a shortest
   path. If you only mark it when it's popped, other nodes in the same ring can queue it again.

**Why is it the shortest?** BFS pops all nodes at distance `d` before any node at distance
`d + 1`. So when the target first leaves the queue, no path with fewer edges was missed. That
argument needs **every edge to cost the same**. With weights, use Dijkstra (a heap instead of a
queue).

The trace below finds the fewest moves through a small maze. The visited cells spread in rings
from the top-left corner, and `dist` goes up by one per ring.

## Variant 3: multi-source BFS

When several cells start spreading **at the same time** (rotten oranges, fires, "distance to the
nearest gate"), put **all** sources in the queue before the first round. The rings then grow from
every source in parallel. Each cell is reached first by its nearest source, and the total work is
still O(V + E). Grid versions of this are covered in
[Islands (Matrix Traversal)](../islands/02-variants.md).

## Variant 4: BFS on an implicit graph

The "nodes" can be states rather than stored objects: a word in a word ladder (neighbours = words
that differ by one letter), a lock combination (neighbours = turn one wheel), a board position.
Generate neighbours on the fly, keep `seen` on the state, and the fewest-moves answer is
BFS distance again.
