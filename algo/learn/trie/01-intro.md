# Trie (Prefix Tree)

> Fundamental · Data structures: tree of characters, hash map / array of children

A hash set answers "is this exact word stored?" in O(L). It can't answer "does any stored word
**start with** `ca`?" without scanning everything. A **trie** stores strings so that every
**prefix** is a node: walk one character per level from the root, and the path spells the prefix.

```
insert: car, cat, cart, dog            ($ = a word ends here)

          (root)
         /      \
        c        d
        |        |
        a        o
       / \       |
      r$  t$     g$
      |
      t$
```

`car` and `cat` share the nodes for `c` and `ca`. That sharing is what makes prefix questions
cheap: everything below the node for `ca` is exactly the set of words starting with `ca`.

## The node

```python
node = {"children": {}, "end": False}      # or a 26-slot array instead of a dict
```

- `children`: next character → child node.
- `end`: a word ends here. You need it because a prefix of a stored word (`ca`) is not itself a
  stored word.
- Optional extras, depending on the problem: `count` (how many words pass through, for
  "how many start with"), or `word` (the full word stored at its end node, handy in DFS).

In Python a nested dict is the shortest version: `node.setdefault(ch, {})` to descend, and a
sentinel key such as `"$"` for the end marker or `"#"` for a count.

## Operations and cost

| Operation | Cost | How |
|---|---|---|
| insert(word) | O(L) | walk, creating missing children; mark the last node |
| search(word) | O(L) | walk; succeed only if the last node is marked `end` |
| startsWith(prefix) | O(L) | walk; succeed if you never fall off |
| all words with prefix | O(L + size of that subtree) | walk to the prefix node, then DFS below it |

L is the length of the query string. None of these depend on how many words are stored. Space is
O(total characters inserted) nodes in the worst case (no shared prefixes), times the alphabet
size if every node keeps a fixed 26-slot array.

## Template

```python
root = {}
def insert(word):
    node = root
    for ch in word:
        node = node.setdefault(ch, {})   # create the child if missing, then step into it
    node["$"] = True                     # mark: a word ends here

def walk(s):                             # shared by search and startsWith
    node = root
    for ch in s:
        if ch not in node:
            return None                  # fell off the trie: no word has this prefix
        node = node[ch]
    return node
```

The animation keeps a **count per node**: how many inserted words pass through it. Then the sum
of the counts along a word's path is the total number of (word, prefix) matches. Watch `root`
grow as the words go in, and `node` step down one level per character.
