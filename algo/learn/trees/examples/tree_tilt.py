"""Worked example (post-order, return vs record): total tilt of a binary tree.

A node's tilt is |sum of its left subtree − sum of its right subtree|. Return the sum of all tilts.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def find_tilt(root) -> int:
    tilt = 0

    def subtree_sum(node) -> int:
        nonlocal tilt
        if node is None:
            return 0  # note: an empty subtree sums to 0
        left = subtree_sum(node.left)
        right = subtree_sum(node.right)  # note: post-order: both children have answered before we use them
        tilt += abs(left - right)  # note: RECORD this node's tilt in the outer variable
        return left + right + node.val  # note: RETURN what the parent needs: this subtree's total

    subtree_sum(root)
    return tilt
