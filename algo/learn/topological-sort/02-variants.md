## Variants

**1. Just "is it possible?"** Run Kahn's and compare `len(order)` with `n`. You don't even need
the order. A counter of processed nodes is enough. This is plain **cycle detection in a
directed graph**.

**2. Return an order.** Return `order` (or `[]` if there's a cycle). There are usually **many**
valid orders. Which one you get depends on the order you seed and pop the queue. If a problem
wants a specific one ("the lexicographically smallest"), replace the queue with a **min-heap**:
O((V + E) log V).

**3. Rounds and levels.** Process the queue level by level (as in the example above) to get
the number of rounds, the longest chain, or the earliest finish time. When tasks have
durations, keep `finish[v] = max(finish[u] + time[v])` over all prerequisites `u`.

**4. Implicit graphs. Build the edges yourself.** Sometimes the dependencies are hidden in the
input. In the classic alien-language problem, each pair of **adjacent** words in a sorted
dictionary gives at most one edge: the first position where they differ says which letter
comes first. Building the edges correctly (including invalid inputs) is most of the work.
After that, it's plain Kahn's.

**5. Peeling leaves in an undirected graph.** The same "remove what has degree 1, update
neighbours, repeat" loop works on an **undirected tree** if you use degree instead of
in-degree. Peeling leaves layer by layer converges on the tree's centre (at most two nodes).

**6. The DFS alternative.** Run a DFS from every unvisited node. A node **finishes** (post-order)
only after everything reachable from it has finished, so the **reverse post-order** is a
topological order. To detect cycles, colour nodes *active* while they're on the current path
and *done* when they finish. An edge into an *active* node is a back edge, which means a cycle.

| | Kahn's (BFS) | DFS post-order |
|---|---|---|
| Cycle check | `len(order) < n` | edge into an "active" node |
| Gives levels/rounds | yes, naturally | no |
| Recursion depth | none | up to V (watch the stack limit) |
| Lexicographic order | swap queue for heap | awkward |

Step through the DFS version below. The call stack is the current path, the `state` map
holds the colours, and `finished` grows in post-order. Reversing it gives the answer.
