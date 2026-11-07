# Heaps

> Fundamental · Data structures: binary heap (priority queue), Python `heapq`

A heap answers one question fast: **"what is the smallest (or largest) item right now?"**, and it
stays fast while items are added and removed. It doesn't keep everything sorted. It keeps just
enough order to know the top.

## The shape: a complete binary tree stored in an array

```
index:   0   1   2   3   4   5
heap:  [ 1,  3,  2,  7,  4,  5 ]

              1            ← heap[0] is always the minimum
            /   \
           3     2
          / \   /
         7   4 5

children of i:  2i + 1, 2i + 2        parent of i:  (i - 1) // 2
```

**The heap property:** every parent is ≤ its children (min-heap). Siblings are in no particular
order, so `[1, 3, 2, ...]` is fine. Because the tree is complete (filled level by level), its
height is about log₂ n. That height is where every O(log n) below comes from.

## How the operations work (in words)

- **push**: put the new item at the end of the array (the next free leaf), then **sift up**:
  swap it with its parent while it's smaller. At most one swap per level.
- **pop**: the answer is the root. Move the **last** item into the root, shrink the array, then
  **sift down**: swap with the *smaller* child while that child is smaller. Again at most one
  swap per level.
- **heapify** (array → heap): sift down every non-leaf, from the last one back to index 0. Most
  nodes are near the bottom and move only a little, so the total is **O(n)**, not O(n log n).

## Operations and their cost

| Operation | `heapq` call | Cost |
|---|---|---|
| peek min | `h[0]` | **O(1)** |
| push | `heappush(h, x)` | O(log n) |
| pop min | `heappop(h)` | O(log n) |
| push then pop (fused) | `heappushpop(h, x)` | O(log n) |
| pop then push (fused) | `heapreplace(h, x)` | O(log n) |
| build from a list | `heapify(h)` | **O(n)**, in place |
| find / delete an arbitrary item | — | O(n): heaps don't support it |
| n smallest / largest | `nsmallest(k, xs)` | O(n log k) |

## Max-heap in Python: negate

`heapq` is only a **min**-heap. For a max-heap, push `-x` and negate again when you pop. With
tuples, negate the field that decides the order: `(-score, name)`.

```python
import heapq
h = [-x for x in nums]
heapq.heapify(h)
largest = -heapq.heappop(h)
```

Below, the heaviest stone always sits at `heap[0]` (as its negative). Watch the leftover piece
being pushed back and finding its place.
