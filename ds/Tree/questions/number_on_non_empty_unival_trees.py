"""
number of non-empty universal value trees
"""
from __future__ import annotations
from typing import Optional
from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: Optional['Node'] = None
    right: Optional['Node'] = None


class Inefficient:
    @staticmethod
    def is_unival(root: Optional[Node]):
        if root is None:
            return True
        if root.left is not None and root.value != root.left.value:
            return False
        if root.right is not None and root.value != root.right.value:
            return False
        if Inefficient.is_unival(root.left) and Inefficient.is_unival(root.right):
            return True
        return False

    @staticmethod
    def count_univals(root: Optional[Node]):
        if root is None:
            return 0
        total_count = Inefficient.count_univals(root.right) + Inefficient.count_univals(root.left)
        if Inefficient.is_unival(root):
            total_count += 1
        return total_count


class Efficient:
    @staticmethod
    def count_univals(root: Optional[Node]) -> int:
        total_count, _ = Efficient.helper(root)
        return total_count

    @staticmethod
    def helper(root: Optional[Node]) -> (int, bool):
        if root is None:
            return 0, True
        right_count, is_right_unival = Efficient.helper(root.right)
        left_count, is_left_unival = Efficient.helper(root.left)

        is_unival = True
        if not is_left_unival or not is_right_unival:
            is_unival = False
        if root.left is not None and root.left.value != root.value:
            is_unival = False
        if root.right is not None and root.right.value != root.value:
            is_unival = False
        if is_unival:
            return left_count + right_count + 1, True
        else:
            return left_count + right_count, False


if __name__ == "__main__":
    node_right_left1 = Node(1, Node(1), Node(1))
    node_right1 = Node(0, node_right_left1, Node(0))
    tree1 = Node(0, Node(1), node_right1)
    # tree1 looks like:
    #         0
    #        / \
    #       1   0
    #          / \
    #         1   0
    #        / \
    #       1   1

    node_right_right2 = Node(4, None, Node(4))
    node_right2 = Node(4, Node(4), node_right_right2)
    tree2 = Node(3, Node(2), node_right2)
    # tree2 looks like:
    #         3
    #        / \
    #       2   4
    #          / \
    #         4   4
    #              \
    #               4

    node_right_right3 = Node(3, None, Node(2))
    node_right3 = Node(3, Node(3), node_right_right3)
    tree3 = Node(3, Node(3), node_right3)


print(Inefficient.count_univals(tree1), 'should be 5')
print(Inefficient.count_univals(tree2), 'should be 5')
print(Inefficient.count_univals(tree3), 'should be 3')
print(Inefficient.count_univals(None), 'should be 0')


print(Efficient.count_univals(tree1), 'should be 5')
print(Efficient.count_univals(tree2), 'should be 5')
print(Efficient.count_univals(tree3), 'should be 3')
print(Efficient.count_univals(None), 'should be 0')