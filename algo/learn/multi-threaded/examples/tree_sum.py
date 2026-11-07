"""Worked example (sequential version of a parallel split): sum of all values in a binary tree.

Reference code for the lesson animation; `# note:` comments become the narration.
This trace is single-threaded on purpose: thread interleavings aren't deterministic, so they
can't be replayed step by step. The narration marks where a concurrent version would split.
"""


def tree_sum(root) -> int:
    def total(node) -> int:
        if node is None:
            return 0
        left = total(node.left)  # note: left subtree — shares nothing with the right one, so it could run in parallel
        right = total(node.right)  # note: right subtree — independent work; a pool would compute it at the same time
        return node.val + left + right  # note: join point — combine both halves (a concurrent version waits here)

    return total(root)  # note: whole tree done
