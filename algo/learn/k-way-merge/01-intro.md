# K-way Merge

> Pattern #15 · Data structures: heap, array, queue

You're given **k sorted lists** (arrays, linked lists, the rows of a sorted matrix) and asked to
merge them, or to find the k-th smallest element across all of them, or the smallest range that
touches every list. Concatenating and sorting throws away the order you were given and costs
O(N log N) for N elements in total.

**The insight:** the next element of the merged order is always the **head** (smallest unused
element) of one of the lists. Keep the k heads in a **min-heap**. Pop the smallest, output it,
and push the **next element from the same list**. The heap never holds more than k entries, so
each of the N elements costs O(log k).

```figure
heap-of-heads
```

It's the two-list merge from merge sort, generalised: instead of comparing two heads with `<`,
the heap compares k heads at once.

## Why the heap entry needs three fields

- **value:** what the heap orders by.
- **list index:** where to fetch the replacement from.
- **element index** (or the node itself, for linked lists): the position of the next element.

Tuples compare field by field, so equal values fall back to comparing the list index. That keeps
the comparison well defined. With linked-list nodes, put the list index **before** the node:
`(node.val, i, node)`. If two values tie, Python compares `i` and never reaches the nodes, which
aren't comparable.

## The template

```python
import heapq

heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
heapq.heapify(heap)                         # k heads, O(k)
out = []
while heap:
    value, i, j = heapq.heappop(heap)       # smallest head overall
    out.append(value)                       # (or: count it, and stop at the k-th)
    if j + 1 < len(lists[i]):
        heapq.heappush(heap, (lists[i][j + 1], i, j + 1))   # refill from the same list
```

The trace merges three arrays, drawn as the rows of a grid. Marked cells are already in the
output, and `popped` is the cell that just left the heap. The heap shows its entries as
`[value, array, index]`.
