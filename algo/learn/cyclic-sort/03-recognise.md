## How to recognise it

**Strong signals:**
- The values are in a range **tied to the length**: `1..n`, `0..n`, `[1, n]` with
  `len(nums) == n`, or "positive integers" where only `1..n` matter.
- The question is about **missing**, **duplicate**, **misplaced** or **corrupt** values: "find
  all numbers that don't appear", "find the duplicate and the missing", "smallest missing
  positive".
- **O(n) time and O(1) extra space** (or "without extra space"), and you **may modify** the
  array.

**Anti-signals: it looks similar, but it's a different pattern:**
- The array is **read-only** and you need O(1) space, as in "find the duplicate in n+1 values
  of 1..n without modifying the array" → **Fast & Slow Pointers** (Floyd on `i → nums[i]`).
  Cyclic sort has to swap.
- Arbitrary values with no range promise (`-10^9..10^9`) → **Arrays & Hashing** (a set or a
  counter), or sort. No value has a home index.
- One missing or one unpaired value, where XOR or a sum identity is enough → **Bitwise
  XOR**. `0 ^ 1 ^ … ^ n ^ all values` leaves the missing one with no mutation. Cyclic sort
  pays off when you need **all** the missing or duplicate values, or the first missing
  positive.
- **Sorting** for its own sake (output must be sorted, values unrestricted) → a comparison
  sort. Cyclic sort only works when values map one-to-one onto indices.
- Ranges with starts and ends that overlap → **Merge Intervals**, not values to place.

**Complexity:**
- Time **O(n)**. Each swap places one value for good (≤ n swaps), and `i` advances ≤ n times.
  The scan adds another n.
- Space **O(1)**, plus the output list when you return all missing or duplicate values.

**Common pitfalls:**
- **Infinite loop on duplicates:** test `nums[i] != nums[j]` (values), not `i != j` (indices).
  When the home already holds a copy, you must move on.
- **Swap order in Python:** `nums[i], nums[nums[i] - 1] = nums[nums[i] - 1], nums[i]` assigns
  `nums[i]` first and then *recomputes* the second index from the new value. Compute
  `j = nums[i] - 1` in its own line first.
- **Out-of-range values:** `0`, negatives and values `> n` must be skipped, not swapped.
  Otherwise you get an IndexError, or `nums[-1]` silently wraps in Python.
- **Off by one in the mapping:** `1..n` maps to `v − 1`, `0..n−1` maps to `v`. Write the mapping
  down before coding.
- **Forgetting the "all present" case:** if the scan finds no mismatch, the answer is often
  `n + 1` (first missing positive) or `n` (missing number in `0..n`).
