# Heaps in practice

## Order by several fields: push tuples

Python compares tuples left to right, so the **first field is the priority** and later fields
break ties:

```python
heapq.heappush(ready, (duration, job_id))     # shortest first; on a tie, lower id first
heapq.heappush(pq, (dist, node))              # Dijkstra
heapq.heappush(pq, (-count, word))            # most frequent first, then alphabetical
```

If two items can tie on everything you put in front of them, add a unique counter (or index)
before any field that **can't be compared**, such as a node object or a dict. Otherwise Python
raises `TypeError` when it compares the objects.

## The shapes heap problems take

| Shape | What's in the heap | Lesson |
|---|---|---|
| keep the **k best** seen so far | size-k heap of the *opposite* kind (min-heap for the k largest) | Top 'K' Elements |
| merge **k sorted** sources | one current head per source | K-way Merge |
| running **median** | max-heap for the low half + min-heap for the high half | Two Heaps |
| **simulation / scheduling**: always process the most urgent next | events or jobs keyed by time / priority | this lesson |
| **greedy repeated extraction**: combine the two smallest, push the result back | all items | this lesson (Top 'K' Elements uses it too) |
| weighted shortest paths (Dijkstra) | (distance, node) | Shortest Paths & MST |

## Example: a scheduler

A CPU runs one job at a time and always picks the **shortest job that has already arrived**.
Two kinds of ordering are mixed here:
- arrivals are processed in time order, so **sort** them once and walk them with an index;
- among the jobs that have arrived, pick by duration, which changes as jobs arrive. That's the
  **heap**.

When nothing is ready, jump the clock to the next arrival instead of ticking one unit at a time.

## Lazy deletion

Heaps can't remove an arbitrary item. The usual trick is to leave stale entries in the heap,
remember they're invalid (a set or a counter), and **discard them when they reach the top**.
The heap is a little bigger, but each operation stays O(log n).
