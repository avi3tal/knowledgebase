# Union-Find (Disjoint Set Union)

> Fundamental · Data structures: parent array (a forest), rank / size array

Some problems only care about **which items are in the same group**, and the groups only ever
**merge**: cities linked by roads, accounts sharing an email, variables declared equal, land cells
touching. Re-running a DFS after every new link costs O(n) per link. **Union-find** keeps the groups
as a forest of parent pointers and answers both operations in almost O(1):

- `find(x)`: the **representative** (root) of x's group.
- `union(a, b)`: merge the groups of a and b.
- Two items are connected iff `find(a) == find(b)`.

```figure
parent-forest
```

## Making it fast

A naive `find` can walk a long chain (O(n)). Two independent tricks fix that:

- **Path compression:** while walking up, re-point nodes closer to the root. *Path halving*
  (`parent[x] = parent[parent[x]]`) is a one-line version that works inside a loop.
- **Union by rank / size:** hang the **smaller** tree under the larger root, so trees stay
  shallow.

With both, a sequence of m operations costs O(m · α(n)), where α is the inverse Ackermann
function (≤ 4 for any realistic n). Treat it as constant. Either trick alone already gives
O(log n).

| Operation | Naive | Rank + compression |
|---|---|---|
| find | O(n) | ~O(1) amortised |
| union | O(n) | ~O(1) amortised |
| space | O(n) | O(n) |

## Template

```python
parent = list(range(n))
size = [1] * n
components = n

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False                    # already connected: this edge closes a cycle
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra                     # smaller tree under the larger root
    size[ra] += size[rb]
    return True
```

Note that `union` **returns whether it merged anything**. That one bit gives you component
counting (`components -= 1` on success) and cycle detection (failure means a path already
existed).

Below: **is this undirected graph a tree?** It needs exactly n − 1 edges, and no edge may join two
nodes that are already connected. Watch `parent` change, and look for the moment `root_a == root_b`.
