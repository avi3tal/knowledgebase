## Variants

**0-1 BFS.** When every edge costs 0 or 1 (remove an obstacle or not, change direction or not),
use a **deque**: push 0-cost neighbours to the **front** and 1-cost neighbours to the **back**.
The deque stays sorted by distance, so it behaves like Dijkstra without the log factor.

```python
dq = deque([start]); dist[start] = 0
while dq:
    node = dq.popleft()
    for nxt, w in neighbours(node):          # w is 0 or 1
        if dist[node] + w < dist[nxt]:
            dist[nxt] = dist[node] + w
            dq.appendleft(nxt) if w == 0 else dq.append(nxt)
```

The animation runs it on a grid where stepping onto a `1` means removing an obstacle (cost 1)
and a `0` is free.

**Bellman-Ford and "at most k edges".** Relax **every** edge, once per round. After round i,
`dist` is optimal over paths with ≤ i edges. Use a **copy** of the previous round's `dist` so a
single round can't chain two edges. V − 1 rounds give the general answer; if a V-th round still
improves something, there's a **negative cycle**.

**Minimax / bottleneck paths.** Dijkstra works for any path cost that never **decreases** when
you extend the path: `max(cost, next height)` in "swim in rising water", `max(cost, |height
difference|)` in "minimum effort". Just replace `d + w` with the new combine.

**State-space Dijkstra.** When the cost depends on more than the node (stops used, keys held,
fuel left), make the heap entries `(cost, node, extra_state)` and key `dist` on
`(node, extra_state)`.

**Multi-source.** Push all sources with distance 0 at the start ("distance to the nearest
hospital").

**DAGs.** No cycles → relax edges in topological order: O(V + E), and it handles negative
weights and **longest** paths (the critical path), which Dijkstra can't do.
