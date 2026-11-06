## How to recognise it

**Strong signals:**
- The input is **sorted**, or the question lets you sort it first (sorting costs O(n log n),
  which is often fine when the brute force is O(n²) or O(n³)).
- It asks about **pairs or triplets**: "two numbers that sum to", "three numbers that sum to
  zero", "closest sum", "pair with the largest area".
- A **palindrome** or other symmetric check compares the ends of a string and works inward.
- It says **in place** / O(1) extra space: remove duplicates, remove an element, move zeroes,
  partition by a pivot or into three colours.
- You're **merging two sorted sequences**, one pointer per input.

**Which template?**
- Search over pairs in sorted or symmetric input → **opposite ends**, moving inward.
- Filter or rearrange while scanning → **same direction**, read and write pointers.
- Three groups → **three pointers** (Dutch flag).
- Triplets → fix one element with an outer loop, then run opposite ends on the rest: O(n²).

**Anti-signals: it looks similar, but it's a different pattern:**
- **Contiguous** subarray or substring with a **running constraint** ("longest substring with
  at most k distinct", "shortest subarray with sum ≥ target") → **Sliding Window**. Both use two
  indices, but there the pointers bound a window whose *contents* you track. Here you only
  care about the two elements at the pointers.
- Pair with a target sum in an **unsorted** array, especially when you must return the
  original indices → **hash map** (two-sum, `arrays-hashing`): O(n) without sorting. Sorting
  would lose the indices and cost O(n log n).
- **Linked list** cycle detection, finding the middle, or the start of a cycle → **Fast &
  Slow Pointers**. The pointers move at different speeds through the same list, and you can't
  walk a singly linked list backwards from the end.
- Looking up **one** value or boundary in a sorted array → **Modified Binary Search**, O(log n).

**Complexity:**
- Time O(n) for one opposite-ends or read/write pass. Add O(n log n) if you have to sort first.
- Triplets: O(n²), from the outer loop times an O(n) inner pass.
- Space O(1) extra (ignoring the output and the sort).

**Common pitfalls:**
- `left < right` vs `left <= right`: decide whether a single middle element still counts.
- **Duplicates** in pair or triplet problems: after recording an answer, skip equal neighbours,
  or you'll report the same pair twice.
- Moving the wrong pointer. Always be able to say *why* the element you drop can't be part of a
  better answer.
- Read/write compaction: return the **new length** (`write`), not `read`, and compare with the
  last *kept* value, not the previous *read* value.
- Applying it to unsorted input without sorting first. The "drop the dominated end" argument
  needs the order.
