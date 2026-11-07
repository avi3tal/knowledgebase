"""Worked example (BST pruning): the sum of all keys that lie in [low, high].

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def range_sum_bst(root, low: int, high: int) -> int:
    total = 0
    stack = [root] if root else []  # note: iterative DFS: the stack holds subtrees still worth visiting
    while stack:
        node = stack.pop()
        if low <= node.val <= high:
            total += node.val  # note: this key is in range — count it
        if node.left and node.val > low:
            stack.append(node.left)  # note: smaller keys live on the left — only worth it if node.val > low
        if node.right and node.val < high:
            stack.append(node.right)  # note: larger keys live on the right — only worth it if node.val < high
    return total
