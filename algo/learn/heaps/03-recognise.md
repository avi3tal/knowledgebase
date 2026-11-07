# How to recognise it

**Strong signals:**
- "**k-th** largest / smallest", "**top k**", "k closest", "k most frequent" → a size-k heap,
  O(n log k).
- You repeatedly need the **current min or max** while items keep arriving or changing →
  priority queue.
- "Always take the **cheapest / earliest / most urgent** next" (greedy + dynamic set) →
  scheduling with a heap.
- Several **sorted** lists or streams to combine → heap of their heads.
- "Median of a stream" → two heaps.

**Anti-signals: it looks similar, but it's a different pattern:**
- You need the min/max of a **sliding window** of the last k items → a monotonic **deque**
  (Sliding Window). A heap would need lazy deletion and gives O(log n) instead of O(1).
- "Next greater element **to the right**" → **Stack** (monotonic). This is a positional
  question, not a global one.
- You need **everything sorted once** and no more inserts → just sort (O(n log n)). A heap pays
  off only when inserts and extracts are mixed.
- The values are small integers in a known range → **bucket by value** (arrays & hashing), which
  can beat a heap at O(n).
- Find the k-th smallest in a **sorted** matrix or arrays → also consider **Modified Binary
  Search** on the value range.

**Complexity:**
- push / pop O(log n), peek O(1), heapify O(n).
- k best of n with a size-k heap: O(n log k) time, O(k) space. Heapify everything and pop k
  times: O(n + k log n).

**Common pitfalls:**
- Forgetting that `heapq` is a **min**-heap. Negate for max, and negate back when you read.
- Expecting `h` to be sorted. Only `h[0]` is guaranteed. `h[1]` isn't necessarily the 2nd
  smallest.
- Using the wrong heap type for top-k. For the k **largest**, keep a **min**-heap of size k and
  pop when it grows past k.
- Tuples whose later fields can't be compared (`TypeError` on ties). Add a counter.
- Popping from an empty heap: check `if h` first.
