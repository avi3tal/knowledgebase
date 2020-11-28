"""
Preorder Tree Traversal
"""


# Data structure to store a Binary Tree node
class Node:
    def __init__(self, key=None, left=None, right=None):
        self.key = key
        self.left = left
        self.right = right


def pre_order(x: Node):
    if x is None:
        return

    print(x.key, end=" ")
    pre_order(x.left)
    pre_order(x.right)


if __name__ == '__main__':
    root = Node(15)
    root.left = Node(10)
    root.right = Node(20)
    root.left.left = Node(8)
    root.left.right = Node(12)
    root.right.left = Node(16)
    root.right.right = Node(25)

    pre_order(root)
