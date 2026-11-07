## Variants you'll meet

**1. Store more at each node.**
- `count`: how many words pass through → "how many words start with p" in O(|p|), prefix scores.
- `word`: the complete word at its end node, so a DFS that reaches it doesn't need to rebuild the
  string from the path.
- `best` / top-k list: precomputed suggestions for autocomplete.

**2. DFS below a node.** Wildcards (`.` matches any letter), "list every word with this prefix",
and "find the words on a grid" all walk the trie *recursively*. At a normal character you follow
one child; at a wildcard you try **every** child. The trie prunes: a branch that isn't a prefix of
any word is never explored.

```python
def match(node, i):
    if i == len(pattern):
        return "$" in node
    ch = pattern[i]
    if ch == ".":
        return any(match(child, i + 1) for key, child in node.items() if key != "$")
    return ch in node and match(node[ch], i + 1)
```

The animation below runs this search. Watch the call stack fan out at the `.` and collapse as
soon as a branch fails.

**3. Trie + backtracking on a grid.** To find many words on a letter board, run **one**
backtracking DFS from each cell and carry the current trie node instead of an index into a single
word. Stop when the next letter isn't a child. Remove found words (or empty branches) so you
don't report duplicates and later searches stay fast.

**4. Binary (bitwise) trie.** Insert numbers bit by bit from the most significant bit (children
`0`/`1`). "Maximum XOR of two numbers" then walks greedily towards the *opposite* bit at each level.
Same structure, alphabet of size 2.
