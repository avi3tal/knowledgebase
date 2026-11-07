"""Worked example (iterative DFS with an explicit stack): sum of all root-to-leaf numbers.

Each root-to-leaf path spells a number (4 → 9 → 5 is 495). Return the sum of those numbers.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def sum_numbers(root) -> int:
    if root is None:
        return 0
    total = 0
    stack = [(root, root.val)]  # note: each entry carries its own state: (node, number spelled so far)
    while stack:
        node, number = stack.pop()  # note: LIFO: the newest node goes first, so we dive deep before going wide
        if node.left is None and node.right is None:
            total += number  # note: a leaf: the path is a complete number
            continue
        if node.right:
            stack.append((node.right, number * 10 + node.right.val))
        if node.left:
            stack.append((node.left, number * 10 + node.left.val))  # note: push left LAST so it pops FIRST
    return total
