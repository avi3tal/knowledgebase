## How to recognise it

**Strong signals:**
- **Find a pattern** inside a text, count occurrences, repeated blocks, periods → string matching
  (KMP / Rabin-Karp / brute force with stated complexity).
- **Equal up to rearrangement / shifting / case** → canonical key + hash map.
- **Subsequence** of another string (order kept, gaps allowed) → greedy two pointers.
- "Convert / parse / encode / decode" with fiddly rules → simulation with an explicit index.
- "Rotation of" → `len(a) == len(b) and b in a + a`.

**Look-alikes and how to tell them apart:**
- **Longest / shortest substring with a condition** (no repeats, at most k distinct, contains
  all of t) → **Sliding Window**.
- **Subsequence optimisation** (longest common subsequence, edit distance) →
  **Longest Common Substring** (2-D DP), not a greedy scan.
- **Palindromic substrings/subsequences** → **Palindromic Subsequence** (expand around the
  centre, interval DP).
- **Prefix queries over many words** → **Trie**.
- **Nested brackets** (valid parentheses, decode `k[...]`) → **Stack**.
- **Pure counting** (anagram check, first unique char) → **Arrays & Hashing**.

**Complexity:**
- Count L, not just n: n strings of length L means O(n · L) work just to read them.
- Sorting characters: O(L log L). Counting: O(L + alphabet).
- KMP / Z-function: O(n + m) worst case. Rabin-Karp: O(n + m) expected, plus a collision check.

**Common pitfalls:**
- Concatenating in a loop: O(n²). Use a list and `join`.
- Substring vs subsequence confusion.
- Forgetting the empty string (`""` is a subsequence and a prefix of everything).
- Off-by-one when flushing the last run in a run-length / look-and-say loop.
- Assuming lowercase ASCII when the problem allows Unicode or mixed case.
