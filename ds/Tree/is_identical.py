"""
Check if two binary trees are identical or not | Iterative & Recursive
"""
# Data structure to store a Binary Tree node
class Node:
    def __init__(self, key=None, left=None, right=None):
        self.key = key
        self.left = left
        self.right = right


def isIdentical(x, y):
    if x is None and y is None:
        return True

    return (x and y) and (x.key == y.key) and isIdentical(x.left, y.left) and isIdentical(x.right, y.right)


if __name__ == '__main__':

    # construct first tree
    x = Node(15)
    x.left = Node(10)
    x.right = Node(20)
    x.left.left = Node(8)
    x.left.right = Node(12)
    x.right.left = Node(16)
    x.right.right = Node(25)

    # construct second tree
    y = Node(15)
    y.left = Node(10)
    y.right = Node(20)
    y.left.left = Node(8)
    y.left.right = Node(12)
    y.right.left = Node(16)
    y.right.right = Node(25)

    if isIdentical(x, y):
        print("Given Binary Trees are identical")
    else:
        print("Given Binary Trees are not identical")