# How to recognise it

**Strong signals:**
- "Find / check whether a **pair, duplicate or complement** exists" in an *unsorted* array →
  hash set or map. One pass, O(n).
- "Same letters", "anagram", "frequency", "most common", "group by" → a **counter** or a dict of
  lists.
- "Sum / product of a range", "everything except index i" → **prefix** (and suffix) arrays.
- "Count subarrays whose sum is k" (negatives allowed) → **prefix sum + hash map**.
- Value range is small and known → use an **array as the map** (counts[26], buckets by value).

**Anti-signals: it looks similar, but it's a different pattern:**
- The array is **sorted** and you want a pair → **Two Pointers** gives O(1) extra space instead
  of a set.
- A **contiguous** window with only non-negative numbers and a "longest / shortest such that" →
  **Sliding Window**, which needs no map of prefixes.
- Values are exactly **1..n** and you must use O(1) extra space → **Cyclic Sort** (use the
  index as the hash).
- "The k most frequent / largest" → count with a map, then **Top 'K' Elements** (heap) for the
  selection.
- A single number that appears once while all others appear twice, in O(1) space → **Bitwise
  XOR**.

**Complexity:**
- Hash map / set: O(n) time, O(n) extra space. Worst case is O(n²) with pathological hashing,
  which interviewers don't expect you to handle.
- Sorting first instead of hashing: O(n log n) time but O(1) extra space. Mention the trade-off.

**Common pitfalls:**
- Adding `x` to the set **before** checking for its partner, so `x` pairs with itself
  (`target = 2·x`).
- Using a mutable list as a dict key. Convert it to a `tuple` first.
- Forgetting the seed `{0: 1}` in prefix-sum counting, which misses subarrays that start at
  index 0.
- Off-by-one between `prefix[r + 1] - prefix[l]` and `prefix[r] - prefix[l]`. Write the
  definition down first.
- Mutating a list while iterating over it, or deleting dict keys inside `for k in d:`.
