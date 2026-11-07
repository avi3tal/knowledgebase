## How to recognise it

**Strong signals:**
- **k sorted** lists, arrays, files or streams, and you need to **merge** them or walk their
  union **in order**.
- "The **k-th smallest** across several sorted lists" or "in a matrix with sorted rows (and
  columns)".
- "The **smallest range** that includes at least one element from each list."
- Pairs or sums from **sorted** arrays in increasing order (k pairs with the smallest sums):
  each row of the sum table is a sorted list.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Two** sorted arrays or lists → **Two Pointers**. With k = 2 you just compare the two heads,
  no heap needed.
- The k largest or smallest of **one unsorted** collection → **Top 'K' Elements**. There are no
  sorted lists to exploit, so a size-k heap over all the elements is the tool.
- The **median** of a stream → **Two Heaps**. You need the middle of a changing set, not a merged
  order.
- The k-th smallest in a sorted matrix with O(1) space, or the median of two sorted arrays in
  O(log) time → **Modified Binary Search**, on the value or on the partition.
- Overlapping **intervals** from several schedules (free time of all employees) → **Merge
  Intervals**. A k-way merge of the schedules by start time is often the first step, but the
  question is about overlaps.

**Complexity:**
- Full merge: O(N log k) time for N elements in total, O(k) heap space (plus the output).
- Stop at the k-th: O(k log m) for m lists, plus O(m) to seed.
- Smallest range: O(N log k). Each element enters and leaves the heap once.

**Common pitfalls:**
- **Pushing the wrong next element.** Refill from the **same** list as the element you popped.
  That's why the entry carries the list index.
- **Comparing nodes.** `(node.val, node)` raises `TypeError` on a tie in Python. Use
  `(node.val, i, node)`.
- **Empty lists.** Skip them when seeding, or `lists[i][0]` crashes.
- **Seeding the whole matrix.** For the k-th smallest you need only the first column (or the
  first `min(n, k)` rows). Pushing all n² cells turns O(k log n) into O(n² log n).
- **Smallest range: continuing after a list ends.** Once the popped element was the last of its
  list, the range can no longer include that list. Stop.
