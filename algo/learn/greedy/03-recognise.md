## How to recognise it

**Strong signals:**
- An optimisation ("maximum number of", "minimum number of") where a **natural order** exists
  (end time, size, deadline, ratio) and one pass in that order seems to work.
- Choices are **independent** once you know a small state (last end time, farthest reach, current
  fuel).
- The constraints want O(n log n) or O(n). n ≈ 10⁵ rules out O(n²) DP.
- You can state an **exchange argument**: swapping in the greedy choice never hurts.

**Look-alikes and how to tell them apart:**
- **Choices interact / overlapping subproblems** (coin change with arbitrary coins, 0/1 knapsack,
  LIS) → **Dynamic Programming** / **0/1 Knapsack** / **Unbounded Knapsack**.
- **Merge or count overlaps** of intervals (not choose a subset) → **Merge Intervals**.
- **Minimum rooms / maximum concurrent** → **Merge Intervals** with a heap of end times, or
  a sweep.
- **Explore all options** (all valid combinations) → **Backtracking**.
- **Shortest path with weights** → **Shortest Paths**. Dijkstra *is* a greedy algorithm,
  but recognise it by its graph signals.

**Complexity:**
- Usually dominated by the sort: O(n log n) time; O(1) or O(n) extra space.
- Greedy + heap: O(n log n).

**Common pitfalls:**
- Sorting by the wrong key (by start instead of end in interval scheduling, by size instead of
  ratio).
- Trusting greedy without a proof or a counterexample search. Test 3–4 tiny inputs by hand.
- Ties: decide how equal keys are ordered and make sure it doesn't matter (or that it's handled).
- Using `>` vs `>=` at boundaries: do touching intervals `[1, 3]` and `[3, 5]` overlap in this problem?
