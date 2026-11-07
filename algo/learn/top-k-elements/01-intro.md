# Top 'K' Elements

> Pattern #14 · Data structures: heap, array, queue

"The k largest", "the k closest", "the k most frequent", "the k-th smallest". You could sort
everything and take k, which is O(n log n). But you only need **k** elements, and you never
need them in order against the other n − k.

**The insight:** keep a heap of **at most k** candidates. The heap's top is the **weakest**
candidate you're keeping, the one to throw out when something better shows up. Each of the n
elements costs at most one O(log k) push or replace, so the scan is **O(n log k)** with
**O(k)** extra space.

The heap points the **opposite** way from the question:

```
want the k LARGEST   → keep a MIN-heap of size k (top = smallest kept = the first to go)
want the k SMALLEST  → keep a MAX-heap of size k (top = largest kept  = the first to go)
```

```
k = 3, scanning 7 10 4 3 20 15 1, want the 3 smallest (max-heap)

after 7 10 4 : heap {10, 7, 4}   top 10
3            : 3 < 10 → evict 10 → {7, 4, 3}   top 7
20           : 20 > 7 → ignore
15           : 15 > 7 → ignore
1            : 1 < 7  → evict 7  → {4, 3, 1}   top 4  ← the 3rd smallest
```

Once the heap is full, its top is the **k-th best so far**. That answers "k-th largest/smallest"
directly, and the whole heap answers "the top k".

## The template

```python
import heapq

heap = []                            # min-heap of the k LARGEST so far
for x in nums:
    if len(heap) < k:
        heapq.heappush(heap, x)
    elif x > heap[0]:                # beats the weakest kept candidate
        heapq.heapreplace(heap, x)   # pop + push in one O(log k) step
# heap = the k largest; heap[0] = the k-th largest
```

- For the k **smallest**, flip it: `heapq` is a min-heap, so store `-x` to get a max-heap and
  read the top as `-heap[0]`.
- With a **key** (distance, frequency), push tuples `(key, item)`. For a max-heap by key, push
  `(-key, item)`. If two keys tie, Python compares the next field, so make sure it's comparable,
  or add an index as a tie-breaker.
- In Go, `container/heap` takes a `Less` method: write `>` for a max-heap instead of negating.

## Why not keep all n in a heap?

`heapify` all n and pop k times is O(n + k log n). That's fine for a one-off array. The size-k
heap wins when **n is huge or a stream** (O(k) memory, and you can answer after every element)
and when k is much smaller than n.

The trace keeps the 3 smallest of `7 10 4 3 20 15 1` in a max-heap. The heap view shows the
**stored** values, so `-10` at the top means 10 is the largest number kept.
