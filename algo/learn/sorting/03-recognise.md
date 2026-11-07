## How to recognise it

**Strong signals:**
- The order of the input **doesn't matter** to the answer (sets of numbers, intervals, pairs), and
  sorting it makes neighbours meaningful.
- "Arrange to form the largest / smallest …" → a **custom comparator**.
- Keys are **small integers** (bounded range) and n is huge → counting / bucket sort, O(n + k).
- Required output in sorted order, or "the k-th in order" over the whole array with no time
  pressure.
- O(n log n) fits the constraints (n ≤ ~10⁶).

**Look-alikes and how to tell them apart:**
- **Only the top k** (or the k-th) is needed → **Top 'K' Elements** (heap) or quickselect;
  a full sort does more work than necessary.
- **Several already-sorted lists** to combine → **K-way Merge** with a heap, O(N log k).
- **Values exactly 1..n** to put in place → **Cyclic Sort**, O(n) and O(1) space.
- **Three colours in one pass, in place** → **Two Pointers** (Dutch national flag).
- **Overlapping ranges** → **Merge Intervals**: sorting is step 1, the sweep is the pattern.
- **Order must be preserved** (subarrays, subsequences) → don't sort, you'd destroy the answer.

**Complexity:**
- Comparison sorting: O(n log n) time. Python's `sort` uses O(n) extra space; quicksort and
  heapsort use O(log n) / O(1).
- Mention the cost of sorting in your final complexity. "O(n) after sorting" means O(n log n) overall.

**Common pitfalls:**
- Sorting when the problem asks about **original indices** (two-sum). Keep `(value, index)` pairs.
- Inconsistent comparators (not transitive), or comparators that return a bool where a
  negative/0/positive int is expected (`cmp_to_key`).
- Forgetting that `list.sort()` returns `None` in Python. Use `sorted(...)` for a new list.
- Mutating the caller's array when an in-place sort isn't allowed.
- Quicksort with a fixed pivot on sorted input: O(n²). Randomise.
