class Node(object):
    def __init__(self, data):
        self.data = data
        self.height = 0
        self.left_child = None
        self.right_child = None


class AVLTree(object):
    def __init__(self):
        self.root = None

    def calc_height(self, node):
        if node is None:
            return -1

        return node.height

    def calc_balance(self, node):
        """
        if the return value is > 1 it means we have left heavy tree --> call right rotation
        if the return value is < -1 it means we have right heavy tree --> call left rotation
        note: sometimes it will require both left/right rotation and then right/left rotation
        """
        if node is None:
            return 0
        return self.calc_height(node.left_child) - self.calc_height(node.right_child)

    def insert(self, data):
        self.root = self.__insert_node(data, self.root)

    def __insert_node(self, data, node):
        if node is None:
            return Node(data)

        # insert the new node
        if data < node.data:
            node.left_child = self.__insert_node(data, node.left_child)
        else:
            node.right_child = self.__insert_node(data, node.right_child)

        node.height = max(self.calc_height(node.left_child), self.calc_height(node.right_child)) + 1

        # fix AVL property violation
        return self.__settle_violation(data, node)

    def __settle_violation(self, data, node):
        balance = self.calc_balance(node)

        # case 1 -> doubly left heavy situation
        if balance > 1 and data < node.left_child.data:
            print("Run doubly left heavy condition")
            return self.__right_rotation(node)
        elif balance < -1 and data > node.right_child.data:
            print("Run doubly right heavy condition")
            return self.__left_rotation(node)
        elif balance > 1 and data > node.left_child.data:
            print("Run left right heavy situation")
            node.left_child = self.__left_rotation(node.left_child)
            return self.__right_rotation(node)
        elif balance < -1 and data < node.right_child.data:
            print("Run right left heavy situation")
            node.right_child = self.__right_rotation(node.right_child)
            return self.__left_rotation(node)

        return node

    def __right_rotation(self, node):
        """
        O(1) time complexity
        """
        print("rotating to the right, node = ", node.data)
        temp_node = node.left_child
        t = temp_node.right_child

        temp_node.right_child = node
        node.left_child = t

        node.height = max(self.calc_height(node.left_child), self.calc_height(node.right_child)) + 1
        temp_node.height = max(self.calc_height(temp_node.left_child), self.calc_height(temp_node.right_child)) + 1

        return temp_node

    def __left_rotation(self, node):
        """
        O(1) time complexity
        """
        print("rotating to the left, node = ", node.data)
        temp_node = node.right_child
        t = temp_node.left_child

        temp_node.left_child = node
        node.right_child = t

        node.height = max(self.calc_height(node.left_child), self.calc_height(node.right_child)) + 1
        temp_node.height = max(self.calc_height(temp_node.left_child), self.calc_height(temp_node.right_child)) + 1

        return temp_node

    def travers(self):
        if self.root is not None:
            self.__travers_in_order(self.root)
        else:
            print("BST is empty")

    def __travers_in_order(self, node):
        """
        Left sub-tree -> root -> right sub-tree
        """
        if node.left_child is not None:
            self.__travers_in_order(node.left_child)

        print("{}".format(node.data))

        if node.right_child is not None:
            self.__travers_in_order(node.right_child)


if __name__ == "__main__":
    tree = AVLTree()
    tree.insert(10)
    tree.insert(20)
    tree.insert(30)

    tree.travers()

    tree.insert(40)
    tree.insert(50)
    tree.insert(60)

    tree.travers()

    tree2 = AVLTree()
    tree2.insert(60)
    tree2.insert(50)
    tree2.insert(40)

    tree2.travers()

    tree2.insert(30)
    tree2.insert(20)
    tree2.insert(10)

    tree2.travers()

    tree3 = AVLTree()
    tree3.insert(50)
    tree3.insert(70)
    tree3.insert(60)

    tree3.travers()

    tree4 = AVLTree()
    tree4.insert(50)
    tree4.insert(30)
    tree4.insert(40)

    tree4.travers()

