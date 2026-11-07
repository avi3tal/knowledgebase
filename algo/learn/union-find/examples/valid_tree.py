"""Worked example (union-find with union by size): is an undirected graph on 0..n-1 a tree?

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def valid_tree(n: int, edges: list[list[int]]) -> bool:
    if len(edges) != n - 1:
        return False  # note: a tree on n nodes has exactly n - 1 edges
    parent = list(range(n))  # note: every node starts as the root of its own group
    size = [1] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # note: path halving — skip a level on the way up
            x = parent[x]
        return x

    for a, b in edges:
        root_a, root_b = find(a), find(b)
        if root_a == root_b:
            return False  # note: a and b are already connected — this edge would close a cycle
        if size[root_a] < size[root_b]:
            root_a, root_b = root_b, root_a
        parent[root_b] = root_a  # note: union by size — hang the smaller tree under the bigger root
        size[root_a] += size[root_b]
    return True  # note: n - 1 merges and no cycle: everything is one tree
