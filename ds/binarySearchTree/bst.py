class Node(object):
    def __init__(self, d):
        self.data = d
        self.right = None
        self.left = None

    def __repr__(self):
        return "Node <data={}>".format(self.data)


class BST(object):
    def __init__(self):
        self.root = None

    def insert(self, v):
        if not self.root:
            self.root = Node(v)
        else:
            self.__insert_node(v, self.root)

    def __insert_node(self, data, node):
        if data > node.data:
            if node.right is None:
                node.right = Node(data)
            else:
                self.__insert_node(data, node.right)
        elif data < node.data:
            if node.left is None:
                node.left = Node(data)
            else:
                self.__insert_node(data, node.left)
        else:
            print("node already exists")

    def get_min_value(self):
        if self.root:
            return self.__min(self.root).data
        else:
            print("BST is empty")

    def __min(self, node):
        if node.left is not None:
            return self.__min(node.left)
        else:
            return node

    def get_max_value(self):
        if self.root:
            return self.__max(self.root).data
        else:
            print("BST is empty")

    def __max(self, node):
        if node.right is not None:
            return self.__max(node.right)
        else:
            return node

    def travers(self):
        if self.root is not None:
            self.__travers_in_order(self.root)
        else:
            print("BST is empty")

    def __travers_in_order(self, node):
        """
        Left sub-tree -> root -> right sub-tree
        """
        if node.left is not None:
            self.__travers_in_order(node.left)

        print("{}".format(node.data))

        if node.right is not None:
            self.__travers_in_order(node.right)

    def find(self, data):
        if self.root is not None:
            return self.__find_node(data, self.root)
        else:
            print("BST is empty")

    def __find_node(self, data, node):
        if node.data == data:
            return node
        elif data > node.data:
            return self.__find_node(data, node.right)
        else:
            return self.__find_node(data, node.left)

    def remove(self, data):
        if self.root is not None:
            self.__remove_node(data, self.root)
        else:
            print("BST is empty")

    def __remove_node(self, data, node):
        if node is None:
            return node

        if data < node.data:
            node.left = self.__remove_node(data, node.left)
        elif data > node.data:
            node.right = self.__remove_node(data, node.right)
        else:
            if node.left is None and node.right is None:
                print("removing a leaf node")
                del node
                return None
            elif node.left is None:
                print("removing a node with right child")
                temp_node = node.right
                del node
                return temp_node
            elif node.right is None:
                print("removing a node with left child")
                temp_node = node.left
                del node
                return temp_node
            else:
                print("removing a node with children")
                temp_node = self.__max(node.left)
                node.data = temp_node.data
                node.left = self.__remove_node(node.data, node.left)

        return node


if __name__ == "__main__":
    bst = BST()
    bst.insert(32)
    bst.insert(10)
    bst.insert(55)
    bst.insert(1)
    bst.insert(19)
    bst.insert(16)
    bst.insert(23)
    bst.insert(79)

    print("root node: ", bst.root)
    print("max value: ", bst.get_max_value())
    print("min value: ", bst.get_min_value())
    bst.travers()

    a = bst.find(55)
    print("node 55 left child is: ", a.left)
    print("node 55 right child is: ", a.right)

    print("removing...")
    bst.remove(55)
    print("root node: ", bst.root)
    print("max value: ", bst.get_max_value())
    print("min value: ", bst.get_min_value())
    bst.travers()
    a = bst.find(32)
    print("node 32 left child is: ", a.left)
    print("node 32 right child is: ", a.right)