## How to recognise it

**Strong signals:**
- Many strings, and the questions are about **prefixes**: starts-with, autocomplete, shortest
  root that prefixes a word, longest common prefix of a set.
- **Many words searched at once** in the same space (a grid, a stream of characters).
- Wildcard matching against a dictionary (`.` = any letter).
- Max / min XOR of pairs → a binary trie over the bits.

**Look-alikes and how to tell them apart:**
- **Exact membership only** (is the word there? count duplicates? group anagrams?) →
  **Arrays & Hashing**. A hash set or map is simpler and just as fast. A trie earns its keep only
  when prefixes matter.
- **One word on a grid** → plain **Backtracking**. The trie pays off when there are many
  words that share prefixes.
- **Substring** questions inside one long string (longest without repeats, minimum window) →
  **Sliding Window**. Tries index the *starts* of strings, not arbitrary windows.
- **Single-number / missing-number puzzles** with XOR → **Bitwise XOR** (one running XOR, no
  trie). Reach for a binary trie only when you must pair each number with its best partner.
- **Sorted words + binary search** also answers prefix range queries (all words between `p` and
  `p + "{"`). Fine for a static list; a trie wins when words are inserted over time or you need
  per-node data.

**Complexity:**
- O(L) per insert / search / prefix check, independent of the number of words.
- Space O(total characters) nodes. A 26-slot array per node is fast but costs 26 pointers per node.

**Common pitfalls:**
- Forgetting the end-of-word flag, so `search("app")` returns true after inserting only `apple`.
- Using the end marker key (`"$"`) as if it were a child during DFS. Skip it when iterating.
- Reporting the same word twice from a grid. Clear the stored word once found.
- Building strings by concatenation on every step of a deep DFS. Store the word at its end
  node instead.
