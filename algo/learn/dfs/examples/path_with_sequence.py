"""Worked example (Tree DFS with a path): is there a root-to-leaf path that spells `sequence`?

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def has_sequence(root, sequence: list[int]) -> bool:
    path = []  # note: the nodes on the current root-to-node path (the recursion's breadcrumbs)

    def dfs(node, i: int) -> bool:
        if node is None or i >= len(sequence) or node.val != sequence[i]:
            return False  # note: dead end: no node, sequence too short, or the value doesn't match
        path.append(node)  # note: choose: extend the path with this node
        if node.left is None and node.right is None:
            if i == len(sequence) - 1:
                return True  # note: a leaf AND the last value of the sequence — the path is complete
        elif dfs(node.left, i + 1) or dfs(node.right, i + 1):
            return True  # note: a child found a full match; pass the answer up the stack
        path.pop()  # note: un-choose: this subtree failed, step back to the parent
        return False

    return dfs(root, 0)
