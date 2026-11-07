# Topological Sort

> Pattern #21 · Data structures: hash map (adjacency list, in-degrees), queue, array

Some problems are about **dependencies**: course A must come before course B, task 3 needs
tasks 1 and 2, package X imports package Y. They ask for an order that respects every
dependency, whether such an order exists at all, or how many "rounds" it takes. The
dependencies form a **directed graph**. A valid order exists exactly when that graph has **no
cycle** (it's a DAG), and such an order is called a **topological order**.

**The insight (Kahn's algorithm):** something with **no remaining prerequisites** can go
next. Take it, cross it off as a prerequisite of everything it unlocks, and repeat. Track, for
every node, how many prerequisites are still pending, its **in-degree**. A node becomes
ready the moment its in-degree drops to 0.

```
edges: 0→2  1→2  1→3  2→4  3→4  4→5

in-degree:  0:0  1:0  2:2  3:1  4:2  5:1
queue: [0, 1]                         ← the sources
take 0 → 2:1                          order: 0
take 1 → 2:0 ✓, 3:0 ✓   queue [2, 3]  order: 0 1
take 2 → 4:1
take 3 → 4:0 ✓          queue [4]     order: 0 1 2 3
take 4 → 5:0 ✓          queue [5]     order: 0 1 2 3 4
take 5                                order: 0 1 2 3 4 5   (all 6 → no cycle)
```

If the queue empties before every node has been taken, the leftover nodes all wait on each
other. That's a **cycle**, and no valid order exists.

## The template

```python
graph = {v: [] for v in range(n)}            # adjacency list: u → nodes it unlocks
in_degree = {v: 0 for v in range(n)}
for u, v in edges:                           # careful with the edge direction!
    graph[u].append(v)
    in_degree[v] += 1
queue = deque(v for v in range(n) if in_degree[v] == 0)
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for nxt in graph[node]:
        in_degree[nxt] -= 1
        if in_degree[nxt] == 0:
            queue.append(nxt)
return order if len(order) == n else []      # shorter → cycle
```

Every node is enqueued once and every edge is relaxed once: **O(V + E)**.

## Level by level

Processing the queue **one level at a time** (`for _ in range(len(queue))`) groups the nodes
into rounds. Everything in one round could happen in parallel. The number of rounds is the
length of the longest dependency chain. That's exactly "the minimum number of semesters if
you can take any number of courses at once".

Step through it below. The views show the adjacency list, the in-degree map, the queue and the
order as it grows. Watch an in-degree reach 0 and the node immediately join the queue.
