"""
https://www.youtube.com/watch?v=7HgsS8bRvjo

Return non empty universal value trees

a unival tree is a tree that has the same value like [2,2,2]
also empty tree is a unival tree
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Node:
    value: int
    left: Optional['Node'] = None
    right: Optional['Node'] = None


def is_unival(root: Optional[Node] = None):
    if root is None:
        return True

    if root.left is not None and root.left.value != root.value:
        return False

    if root.right is not None and root.right.value != root.value:
        return False

    if is_unival(root.left) and is_unival(root.right):
        return True
    return False


def count_univals(root: Optional[Node] = None):
    """
    O(n^2)
    """
    if root is None:
        return 0

    total_count = count_univals(root.left) + count_univals(root.right)
    if is_unival(root):
        total_count += 1

    return total_count

print(count_univals(Node(value=1, left=Node(value=2, left=Node(2), right=Node(2)), right=Node(1))))


# Option 2 more efficient
def helper(root: Optional[Node] = None):
    if root is None:
        return 0, True

    left_count, left_is_unival = helper(root.left)
    right_count, right_is_unival = helper(root.right)

    is_it_unival = True
    if not left_is_unival or not right_is_unival:
        is_it_unival = False
    if root.left is not None and root.left.value != root.value:
        is_it_unival = False
    if root.right is not None and root.right.value != root.value:
        is_it_unival = False

    if is_it_unival:
        return left_count + right_count + 1, True

    return left_count + right_count, False


def count_univals2(root: Optional[Node] = None):
    """
    O(n)
    """
    total_count, _ = helper(root)
    return total_count


print(count_univals2(Node(value=1, left=Node(value=2, left=Node(2), right=Node(2)), right=Node(1))))