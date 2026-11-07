## Counting sort: when keys are small integers

If every key lies in `0..k` with k not much bigger than n, count them instead of comparing:

1. `counts[v]` = how many times v occurs.
2. Turn counts into **starting positions** with a running (prefix) sum.
3. Walk the input and place each value at its position, then advance that position. This keeps
   it stable.

O(n + k) time, O(n + k) space. Typical signals: grades 0–100, ages, letters, colours 0/1/2.

## Sorting by a custom key

Most "sorting problems" are really about **what to sort by**:

```python
people.sort(key=lambda p: (-p.height, p.k))     # height descending, then k ascending
intervals.sort(key=lambda iv: iv[1])            # by end time (greedy scheduling)
words.sort(key=lambda w: (len(w), w))           # by length, ties alphabetically
```

- Tuples compare element by element, so `(primary, secondary)` sorts by several keys at once.
  Negate a number to sort that component in descending order.
- When the order isn't a per-item key but a **pairwise rule** (decide which of two items goes first by comparing both orders), use
  `functools.cmp_to_key(cmp)` in Python or `sort.Slice` with a `less` function in Go. The rule
  must be consistent (transitive), or the result is garbage.

## Sort first, then sweep

| After sorting… | …this becomes easy |
|---|---|
| equal values are adjacent | dedupe, count runs, group |
| the closest pair is adjacent | minimum difference in one pass |
| intervals are ordered by start | merge / detect overlaps in one sweep |
| the array is monotone | two pointers from both ends, binary search |

## Partial sorting is often enough
- **k smallest / largest** → a heap (O(n log k)) or quickselect (O(n) average), not a full sort.
- **Nearly sorted** (each item ≤ k away from its place) → insertion sort O(n·k) or a size-k heap
  O(n log k).
