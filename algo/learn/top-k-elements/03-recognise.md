## How to recognise it

**Strong signals:**
- "**k** largest / smallest / closest / most frequent / highest-scoring" or "the **k-th**
  largest / smallest" with a **fixed k**.
- A **stream** where you report the k-th best after every insert (a leaderboard, a running top-k).
- "Sort by frequency", "most common", "reorganise so no two equal letters are adjacent": count
  first, then a heap keyed by count.
- "Repeatedly combine the two smallest / take the largest" (connect ropes, last stone weight).

**Anti-signals: it looks similar, but it's a different pattern:**
- The **median** or a boundary that **moves with the data** (half of the elements, not k of them)
  → **Two Heaps**. A size-k heap can't follow a k that grows with the stream.
- The k-th smallest across **several sorted lists** or a **sorted matrix** → **K-way Merge**.
  The inputs are already sorted, so a heap of k **list heads** beats looking at every element.
- The k-th smallest in a **sorted** array or in a value range you can count → **Modified Binary
  Search** (binary search on the answer, and count how many elements are ≤ mid).
- "Max sum of **k consecutive** elements" → **Sliding Window**. It's about a contiguous run, not
  the k best anywhere.
- Values in **1..n** with "find the missing / duplicate numbers" → **Cyclic Sort**, even when
  the question says "the first k missing".

**Complexity:**
- Size-k heap scan: O(n log k) time, O(k) space.
- Heapify all + pop k: O(n + k log n) time, O(n) space.
- Frequency problems: O(n) to count, plus O(d log k) for the d distinct values. Bucket sort makes
  it O(n).
- Quickselect: O(n) average, O(n²) worst, O(1) extra space.

**Common pitfalls:**
- **The heap points the wrong way.** For the k largest you want a **min**-heap, because its top is
  the one to evict. A max-heap of all elements works too, but it's O(n) space.
- **Negation done halfway.** If you push `-x`, read `-heap[0]`. With tuples, negate the key only:
  `(-dist, x, y)`.
- **Ties in tuples.** `(dist, point)` compares the second field when distances tie. If the second
  field isn't comparable (a dict, a node), Python raises `TypeError`. Add an index:
  `(dist, i, item)`.
- **Pushing then popping.** `heappush` followed by `heappop` once the heap reaches k + 1 is fine,
  but `heapreplace` (or comparing with the top first) skips the push for elements that can't make
  it.
- **Square roots for distance.** Compare `x² + y²`. `sqrt` adds float noise and nothing else.
