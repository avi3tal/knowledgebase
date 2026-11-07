"""Worked example (BFS, level by level): the average value of each level of a binary tree.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

from collections import deque


def level_averages(root) -> list[float]:
    averages = []
    queue = deque([root]) if root else deque()  # note: the queue holds the frontier: discovered, not yet visited
    level = 0
    while queue:
        size = len(queue)  # note: freeze the level size: exactly these nodes form the current level
        total = 0
        for _ in range(size):
            node = queue.popleft()  # note: FIFO: the oldest node leaves first
            total += node.val
            if node.left:
                queue.append(node.left)  # note: children join the BACK of the queue: they belong to the next level
            if node.right:
                queue.append(node.right)
        averages.append(total / size)  # note: the level is finished; only next-level nodes remain in the queue
        level += 1
    return averages
