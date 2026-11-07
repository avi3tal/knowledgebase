"""Worked example (DFS in a trie): does any word match a pattern where '.' is any letter?

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def wildcard_search(words: list[str], pattern: str) -> bool:
    root: dict = {}
    for word in words:
        node = root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True  # note: build the trie first; '$' marks the end of a word

    def match(node: dict, i: int) -> bool:
        if i == len(pattern):
            return "$" in node  # note: pattern used up — matched only if a word ends exactly here
        ch = pattern[i]
        if ch == ".":
            for key, child in node.items():
                if key != "$" and match(child, i + 1):
                    return True  # note: wildcard — try every child, stop at the first that matches
            return False
        return ch in node and match(node[ch], i + 1)  # note: a normal letter — exactly one child to follow

    return match(root, 0)
