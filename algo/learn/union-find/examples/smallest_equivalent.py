"""Worked example (union-find on letters): lexicographically smallest equivalent string.

s1[i] and s2[i] are equivalent letters (the relation is transitive). Rewrite `base` replacing
each letter with the smallest letter it is equivalent to.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def smallest_equivalent(s1: str, s2: str, base: str) -> str:
    parent: dict[str, str] = {}

    def find(x: str) -> str:
        parent.setdefault(x, x)  # note: letters join lazily — a dict instead of an array
        while parent[x] != x:
            x = parent[x]
        return x

    for a, b in zip(s1, s2, strict=True):
        root_a, root_b = find(a), find(b)
        if root_a != root_b:
            small, big = min(root_a, root_b), max(root_a, root_b)
            parent[big] = small  # note: the smaller letter becomes the root — it represents the group
    return "".join(find(c) for c in base)  # note: each letter's root is the smallest equivalent
