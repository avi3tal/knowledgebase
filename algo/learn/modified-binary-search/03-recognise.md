## How to recognise it

**Strong signals:**
- The input is **sorted**, or sorted in pieces: **rotated**, **bitonic / mountain**, a matrix
  with sorted rows and columns.
- The question asks for **O(log n)**, or n is huge (10⁹ values, a range of numbers) so even a
  linear scan is too slow.
- You need a **position next to a value**: ceiling, floor, insert position, first/last
  occurrence, the smallest element larger than x.
- "Find the **minimum / maximum value x such that** some condition holds", and the condition is
  monotonic in x → binary search on the answer (square root, capacity, speed).

**Anti-signals: it looks similar, but it's a different pattern:**
- **Pairs** in a sorted array (two numbers that sum to a target, closest pair) → **Two
  Pointers**. One pass from both ends is O(n). Binary searching a partner for every element is
  O(n log n).
- The k smallest / largest / closest elements of an **unsorted** array → **Top 'K' Elements**
  (heap). Binary search needs order to throw away half.
- Searching for a value across **many sorted lists**, or the k-th smallest of several lists →
  usually **K-way Merge** with a heap. (A few hard problems, such as the median of two sorted
  arrays, do binary search over a partition, so check the required complexity.)
- Values in a fixed range 1..n in an unsorted array, missing or duplicate numbers → **Cyclic
  Sort**, O(n), not "sort then binary search".

**Complexity:**
- Time O(log n) per search: the live range halves every step. Binary search on an answer
  range `[lo, hi]` costs O(log(hi - lo)) times the cost of the test.
- Space O(1) iterative (O(log n) if written recursively).

**Common pitfalls:**
- `while lo <= hi` vs `while lo < hi`, and `hi = mid - 1` vs `hi = mid`. Pick one loop shape
  (see the table in the variants) and keep its rules together.
- Overflow in `(lo + hi) / 2` in Java, Go or C++ with large indices. Use `lo + (hi - lo) / 2`.
- Returning the wrong boundary after the loop: `lo` is the first index past the smaller values
  (ceiling / insert position), and `hi` is the last index before the bigger values (floor).
- Rotated arrays: only trust the range check on the half that is actually sorted, and remember
  that with duplicates `nums[lo] == nums[mid]` tells you nothing.
- Forgetting the empty-array case, and keys smaller or bigger than every element.
