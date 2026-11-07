## How to recognise it

**Strong signals:**
- "**Median**" of a **stream**, of numbers **added one at a time**, or of a **sliding window**.
- Any question about the **boundary between two halves** of a changing set: "the middle element",
  "balance the smaller and larger half", "the k-th smallest where k grows with the set" (for
  example, a percentile that moves as items arrive).
- Two **competing orders** over the same items: one to decide *when an item becomes eligible*
  (capital required, arrival time) and one to decide *which eligible item is best* (profit,
  priority). Maximise capital, task scheduling.
- "For each interval, the interval with the **smallest start ≥ its end**" (next interval).

**Anti-signals: it looks similar, but it's a different pattern:**
- "**k** largest / smallest / most frequent" with a **fixed k** → **Top 'K' Elements**. One heap of
  size k is enough, since you only care about one side of the boundary and k doesn't move with
  the data.
- Merging or picking the k-th element across **several sorted lists** → **K-way Merge**. One
  min-heap of list heads, with no halves to balance.
- The median of **two sorted arrays**, given all at once → **Modified Binary Search**. Nothing
  streams in, and binary search on the partition is O(log n), which beats any heap.
- Sliding window **max or min** (not median) → a monotonic deque (**Sliding Window** family). A
  max only needs one end, so the deque does it in O(1) per step.
- Intervals that you **merge** or count overlaps of (meeting rooms) → **Merge Intervals**. Even
  when a min-heap of end times appears there, the core is sorting by start and sweeping.

**Complexity:**
- Insert O(log n): one push plus at most one move. Median O(1): read the tops.
- Space O(n) for the stream. For a window it is O(k) with a sorted container, O(n) with lazy deletion (stale entries).
- Sliding-window median with lazy deletion: O(n log n) time. Stale entries can pile up below the
  tops, but each is popped at most once. A balanced BST or sorted container makes it O(n log k).
- Unlock-then-pick (IPO): O(n log n). Every item moves from the gate heap to the pick heap at most
  once.

**Common pitfalls:**
- **Forgetting to negate** both ways. Push `-x` **and** read `-lo[0]`. One missing minus sign gives
  a min-heap of the small half, and the median comes out as the minimum.
- **Inserting without comparing**. Pushing every new value into `lo` and then rebalancing by size
  alone breaks the order invariant. Compare with `lo`'s top first (or push to `lo`, then always move
  `lo`'s top to `hi`, then rebalance sizes).
- **Integer division** for the even case. `(a + b) // 2` floors, and the median of `[1, 2]` is
  `1.5`. In Go and Java, `a + b` can also overflow `int32` near the limits.
- **Window removal from the wrong half**. With lazy deletion, decide the side by comparing the
  leaving value with `lo`'s top, and keep the valid sizes yourself.
- **IPO with nothing affordable**: if no project is unlocked, stop. Don't pop from an empty heap.
