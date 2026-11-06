## How to recognise it

**Strong signals:**
- The input is a **linear sequence**: an array, string or linked list.
- The question is about a **contiguous** subarray or substring ("consecutive", "substring",
  "window", "subarray").
- It asks for a **longest / shortest / max / min / count** of such windows.
- There's a constraint you can maintain incrementally: a sum ≤ / ≥ target, at most k distinct,
  no repeats, at most k replacements, or containing all chars of t.

**Fixed or dynamic?**
- A size **k is given** → fixed window.
- "Longest / shortest window **such that**…" → dynamic window, grow and shrink.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Subsequence** (elements needn't be adjacent) → usually DP (Longest Common Substring /
  Palindromic Subsequence patterns).
- **Pairs** that sum to a target in a *sorted* array → **Two Pointers**, moving inward from
  both ends.
- Sums that can **go down** when you add (negative numbers) break "shrink while sum ≥ target".
  Use **prefix sums + hash map** instead (e.g. subarray sum equals K).
- The top-k largest elements anywhere in the array, not contiguous → **Top 'K' Elements**
  (heap).

**Complexity:**
- Time O(n): each index enters and leaves the window once.
- Space O(1) for a running sum, or O(k) / O(alphabet) for the counts map.

**Common pitfalls:**
- Off-by-one in the window length: it's `end - start + 1`.
- Forgetting to delete a key whose count reached 0, so the distinct count stays wrong.
- Recording the answer at the wrong moment: before shrinking for "longest", inside the shrink
  loop for "shortest".
