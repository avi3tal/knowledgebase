## Variant 1: the median of a sliding window

Now elements also **leave**. A heap can't delete an arbitrary element cheaply, so use
**lazy deletion**:
- Keep a counter `delayed[value]` of elements that have left the window but may still be inside a
  heap.
- Track the **valid sizes** of `lo` and `hi` yourself (`len()` counts dead elements too).
- When a delayed value reaches the **top** of a heap, pop it then and decrement its counter
  ("prune the top").
- On removal, decide which half the leaving value belongs to by comparing it with `lo`'s top,
  shrink that half's valid size, and rebalance.

Each element is pushed once and popped at most once, so the total is O(n log n) even though dead
entries can pile up below the tops. The alternative is a sorted container (balanced BST or
`SortedList`) with O(log k) removal, for O(n log k).

## Variant 2: two heaps with different roles ("unlock, then pick the best")

The two heaps don't have to be the halves of one set. A common shape is **locked** versus
**available** items:

```
locked    : min-heap by requirement  (capital needed, start time, …)
available : max-heap by reward       (profit, priority, …)

repeat:
    move every locked item whose requirement is now met → available
    take the best available item, which raises what you can afford next
```

- **Maximise capital (IPO):** projects need a minimum capital and pay a profit. With at most k
  projects, unlock everything you can afford, then take the most profitable one.
- **Scheduling with arrival times:** tasks become available at their arrival time, and you always
  run the shortest (or highest-priority) available task.

The first heap is a **gate** that releases items in requirement order. The second picks the best
of what has been released. Each item moves across once, so the work is O(n log n).

## Variant 3: the smallest start ≥ an end ("next interval")

For each interval, find the interval that starts at or after it ends, with the smallest start.
- Put every interval in a **max-heap by start** and a **max-heap by end**.
- Take ends from the largest down. For the current end, keep popping starts while the top start is
  still ≥ that end, and remember the last one popped. That is the smallest start ≥ end.
- **Push the remembered start back**: the next (smaller) end may need the same answer.
- Why it's safe to drop the others: every start popped for this end is bigger than the one pushed
  back, and that one also qualifies for every later (smaller) end. So they can never be the
  smallest answer again.
- The same question also falls to **sorting + binary search** (sort the starts, then
  `bisect_left` for each end). Interviewers accept either. The heap version is the one the
  DesignGurus course files under Two Heaps.

## Choosing the median when the count is even

- Both tops averaged (`(-lo[0] + hi[0]) / 2`) is the usual definition, and the result is a
  **float**.
- When any point between the two middles is as good (like the meeting point above), `lo`'s top is
  enough.
- Keep `lo` as the bigger heap on odd counts. Then the odd case is always `-lo[0]` and you never
  have to check which side is bigger.
