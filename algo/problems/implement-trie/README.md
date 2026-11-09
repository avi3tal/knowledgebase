# Implement Trie (Prefix Tree)

> Difficulty: **medium** · Patterns: trie, design · Sources: [leetcode](https://leetcode.com/problems/implement-trie-prefix-tree/)

## Problem
Build a `Trie` class that stores lowercase words and supports:
- `insert(word)`: add `word` to the set of stored words.
- `search(word)`: return `true` if exactly `word` was inserted before.
- `startsWith(prefix)`: return `true` if some stored word begins with `prefix`.

## Examples
```text
Trie()
insert("apple")
search("apple")    → true
search("app")      → false   ("app" is only a prefix so far)
startsWith("app")  → true
insert("app")
search("app")      → true
```

## Constraints
- `1 <= word.length, prefix.length <= 2000`, lowercase English letters only.
- Up to `3 * 10^4` calls in total.
- Each operation should cost O(L), where L is the length of its argument, independent of how many
  words are stored.

## Pattern & how to recognise it
- Many queries that ask about **prefixes** of a set of strings → a **trie**. A hash set answers
  `search` in O(L) but can't answer `startsWith` without scanning every word.
- Lesson: [Trie](../../learn/trie/01-intro.md).

## Learning material
- A trie is a tree where each edge is a character and each node stands for the prefix spelled on
  the way down from the root. Words sharing a prefix share a path.
- Each node needs: its children (a dict `char → node`, or a 26-slot array) and an
  **end-of-word flag**, because a prefix of a stored word is not a stored word by itself.
- Time per operation: O(L). Space: O(total characters inserted) nodes in the worst case.
- [Trie (Wikipedia)](https://en.wikipedia.org/wiki/Trie)

## Hints
<details><summary>Hint 1</summary>

What should a single node hold? Think about what distinguishes "app was inserted" from "apple was
inserted, so app is only a prefix".
</details>
<details><summary>Hint 2</summary>

`search` and `startsWith` walk the same path from the root. They differ only in what they check
when the walk finishes.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

A node is `{children: dict, end: bool}`. `insert` walks from the root, creating missing children,
and sets `end = True` on the last node. A shared helper walks a string and returns the node it
reaches, or nothing if a character is missing. `search` returns `node is not None and node.end`;
`startsWith` returns `node is not None`.

Expected complexity: time O(L) per operation, space O(total inserted characters).

</details>

## Follow-ups
- Add `countWordsStartingWith(prefix)` and `erase(word)`: store a pass-through count per node.
- Support `.` as a wildcard in `search` (DFS over all children at a dot).
- Arrays of 26 vs dicts: memory/speed trade-offs.
