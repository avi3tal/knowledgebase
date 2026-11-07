# Two Heaps

> Pattern #10 · Data structures: heap, array

Some problems keep asking about the **middle** of a collection that keeps changing: the median of
the numbers seen so far, the median of the current window, or the best item among the ones you
are currently allowed to pick. Sorting after every change costs O(n log n) each time, and keeping
a sorted list costs O(n) per insert.

**The insight:** you never need the whole order, only the **boundary** between two halves. Split
the elements into two heaps:
- `lo`: a **max-heap** with the **smaller half**. Its top is the largest small number.
- `hi`: a **min-heap** with the **larger half**. Its top is the smallest large number.

The median sits on the boundary, so it's always one of the two tops (or their average). Each
insert costs O(log n) and reading the median costs O(1).

```
stream so far: 5 15 1 3 8

      lo (max-heap)            hi (min-heap)
   small half: 1 3 5        large half: 8 15
            top = 5  │  top = 8
                     ▲
          every value in lo ≤ every value in hi
          len(lo) == len(hi) or len(lo) == len(hi) + 1
          odd count  → median = top of lo = 5
          even count → median = (top of lo + top of hi) / 2
```

## The two invariants

1. **Order:** every element of `lo` is ≤ every element of `hi`. You only need to compare with the
   tops to keep this.
2. **Size:** `len(lo)` is equal to `len(hi)` or one more. Then the top of `lo` is always the
   (lower) median.

Each insert may break one invariant, and one move of a top element to the other heap fixes it.

## Max-heaps in Python

`heapq` only has a **min-heap**. The standard trick is to store **negated** values in `lo`: push
`-x`, and read the top as `-lo[0]`. The trace below shows the stored values, so `-5` in `lo` means
`5`. (In Go, `container/heap` takes a `Less` method, so you write `>` for the max-heap.)

## The template

```python
import heapq

lo, hi = [], []                      # lo: max-heap (negated), hi: min-heap

def add(x):
    if not lo or x <= -lo[0]:
        heapq.heappush(lo, -x)       # belongs to the small half
    else:
        heapq.heappush(hi, x)        # belongs to the large half
    if len(lo) > len(hi) + 1:        # rebalance: lo may be at most one bigger
        heapq.heappush(hi, -heapq.heappop(lo))
    elif len(hi) > len(lo):
        heapq.heappush(lo, -heapq.heappop(hi))

def median():
    if len(lo) > len(hi):
        return -lo[0]
    return (-lo[0] + hi[0]) / 2
```

The worked example below uses the median for something else. Friends arrive one by one and stand
at points on a line. After each arrival, what is the minimum total distance for all of them to
meet at one point? The best meeting point is a **median** (moving the point towards the bigger
side always shortens the total). Each heap also keeps its **sum**, so the cost is:

```
cost = (median·len(lo) − sum(lo))  +  (sum(hi) − median·len(hi))
        everyone below walks up        everyone above walks down
```

Watch both tops: after every arrival `lo`'s top (un-negated) is the median, and the sizes never
differ by more than one.
