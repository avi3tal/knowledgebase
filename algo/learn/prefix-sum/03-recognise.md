## How to recognise it

**Strong signals:**
- **Many range-sum queries** on an array (or a matrix) that doesn't change.
- **Count** or find the **longest** subarray with a sum condition (= k, divisible by k,
  balanced 0/1), especially when values can be **negative**.
- "Left part vs right part" comparisons at every index (pivot index, split into equal halves).
- "Everything except i" without division (prefix and suffix products).
- Many range **updates**, read once at the end → difference array.

**Look-alikes and how to tell them apart:**
- **All values non-negative** and you want the shortest/longest window under a sum limit →
  **Sliding Window**, O(1) space. Prefix sums still work but need the map.
- **Fixed size k** window sum or max → **Sliding Window** (a running sum is a 2-term prefix sum).
- **Pairs** (not ranges) that sum to a target → **Two Pointers** (sorted) or a hash map of
  values (**Arrays & Hashing**).
- **Maximum** subarray sum → Kadane (**Dynamic Programming**). It's "prefix minus the smallest
  earlier prefix", but nobody writes it that way.
- **Range queries on a changing array** (point updates between queries) → a Fenwick or segment
  tree. Plain prefix sums would need an O(n) rebuild per update.

**Complexity:**
- Build O(n), each query O(1), space O(n) (or O(1) with a running sum).
- Prefix + hash map counting: O(n) time, O(n) space.

**Common pitfalls:**
- Off-by-one: `P` has n + 1 entries, and `sum(l..r) = P[r+1] − P[l]`.
- Forgetting to seed the map with the empty prefix (`{0: 1}` or `{0: -1}`), which misses
  subarrays that start at index 0.
- Inserting the current prefix **before** looking up. With k = 0 you then count an empty subarray.
- Storing the **last** index instead of the first when you want the longest subarray.
- Negative remainders in languages where `%` can return a negative value.
