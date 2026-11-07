# Shortest Paths

> Fundamental · Data structures: adjacency list, min-heap (priority queue), distance map

BFS finds the fewest **edges** between two nodes. Once edges have different **weights** (minutes,
prices, distances), fewest edges is no longer cheapest:

```
        4
   A ───────── B          BFS (fewest edges):  A → B        cost 4
    \         /           cheapest:            A → C → B    cost 1 + 2 = 3
   1 \       / 2
      \     /
        C
```

## Pick the algorithm by the graph

| Graph | Algorithm | Time |
|---|---|---|
| all edges cost the same | **BFS** | O(V + E) |
| edge costs are only 0 or 1 | **0-1 BFS** (deque) | O(V + E) |
| non-negative weights, one source | **Dijkstra** (min-heap) | O((V + E) log V) |
| negative weights, or "at most k edges" | **Bellman-Ford** (k or V − 1 rounds) | O(k · E) / O(V · E) |
| DAG (no cycles) | relax in **topological order** | O(V + E) |
| all pairs, small V (≤ ~400) | **Floyd-Warshall** | O(V³) |

## Dijkstra

**Invariant:** the node popped from the min-heap with the smallest tentative distance is
**final**. Every other route to it would have to leave the explored region through some node at
least as far away, and with non-negative weights it can only get longer from there.

```python
dist = {src: 0}
heap = [(0, src)]
while heap:
    d, node = heapq.heappop(heap)
    if d > dist[node]:
        continue                         # stale entry: a shorter one was already processed
    for nxt, w in graph[node]:
        nd = d + w
        if nd < dist.get(nxt, inf):      # relax the edge
            dist[nxt] = nd
            prev[nxt] = node             # remember how we got here, to rebuild the path
            heapq.heappush(heap, (nd, nxt))
```

- **Lazy deletion:** Python's `heapq` has no decrease-key, so push a new entry and skip stale
  ones when they're popped. The heap holds O(E) entries.
- You can **stop early** when the target is popped. Its distance is final.
- `prev` (or `parent`) pointers rebuild the actual path: walk back from the target.

In the animation, watch the heap always hand out the closest node, and see `dist[1]` improve
from 4 to 3 when the route through node 2 is found. Node 1's old heap entry `(4, 1)` becomes stale.
