## How to recognise it

**Strong signals:**
- The input is a list of **pairs `[start, end]`**: meetings, appointments, bookings, jobs,
  ranges on a number line.
- The words **overlap, conflict, merge, union, intersection, free time, gaps** or "**at the
  same time**".
- "Insert a new interval", "can one person attend all meetings?", "how many rooms or
  machines are needed?", "what's the peak load?"
- The input is **sorted** by start, or you're allowed to sort it. That's what makes a single
  sweep possible.

**Which variant?**
- Combine overlapping ranges → sort, then **merge with `merged[-1]`**.
- Already sorted and disjoint, plus one new interval → the **three-phase insert** (O(n), no
  sort).
- Two sorted lists → **two pointers**, intersect with `[max starts, min ends]`, advance the
  one that ends first.
- "How many at once", or "minimum rooms" → **min-heap of end times**, or a sweep line of +1/−1
  events.

**Anti-signals: it looks similar, but it's a different pattern:**
- A **contiguous subarray** of one array, with a sum or count condition → **Sliding Window**.
  The "window" there is positions in an array, not ranges you were given.
- "Pick the **most non-overlapping** intervals" or "fewest arrows to burst all balloons" →
  **Greedy**, sorted by **end** time. You still sort, but you choose and discard instead of
  merging. (Merging by start gives the wrong answer here.)
- Two **sorted arrays of numbers** to merge or intersect → **Two Pointers**. The intersection
  variant here borrows that move, but on ranges.
- Only the **k smallest/largest** of something, with no time axis → **Top 'K' Elements**. A
  heap appears in both, but here it holds *end times of running intervals*.
- Dependencies like "A must finish before B" → **Topological Sort**. Order constraints aren't
  intervals on a line.

**Complexity:**
- Time **O(n log n)** for the sort. The sweep itself is O(n), or O(n log n) with the heap.
  If the input is already sorted (insert, intersect), it's O(n) in total.
- Space **O(n)** for the output, or O(n) for the heap in the worst case, when every interval
  overlaps every other.

**Common pitfalls:**
- **`max` when extending:** `merged[-1][1] = max(merged[-1][1], end)`, not `= end`. An
  interval contained in the previous one, `[1,10]` then `[2,3]`, must not shrink it.
- **Touching ends:** decide whether `[1,4]` and `[4,6]` overlap. Merging usually says yes
  (`<=`). Meeting rooms usually say no, because the room is free at 4 (`<`, or pop when
  `heap[0] <= start`).
- **Sorting by the wrong key:** merge and room-count sort by **start**. Greedy "keep the most"
  sorts by **end**.
- **Mutating the input** while you sweep it. Append copies, or build a new `merged` list.
- **Comparing with the input instead of the output:** check overlap against `merged[-1]` (the
  grown interval), not `intervals[k-1]`. The previous input interval may have been swallowed
  by an even earlier one.
