"""
Level Order Traversal of Binary Tree
"""


# Data structure to store a Binary Tree node
class Node:
    def __init__(self, key=None, left=None, right=None):
        self.key = key
        self.left = left
        self.right = right


def print_level(x: Node, level: int):
    if x is None:
        return False

    if level == 1:
        print(x.key, end=" ")
        return True

    left = print_level(x.left, level - 1)
    right = print_level(x.right, level - 1)

    return left or right


def level_order_traversal(root):
    if root is None:
        return

    level = 1
    while print_level(root, level):
        level += 1


if __name__ == '__main__':
    root = Node(15)
    root.left = Node(10)
    root.right = Node(20)
    root.left.left = Node(8)
    root.left.right = Node(12)
    root.right.left = Node(16)
    root.right.right = Node(25)

    level_order_traversal(root)
