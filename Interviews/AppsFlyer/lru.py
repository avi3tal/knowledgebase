class Node:
    def __init__(self, k):
        self.k = k


class LRUCache:
    def __init__(self, size: int):
        self.__size = size
        self.__cache = []
        self.__key_map = {} # k > Node

    def __reorder(self, node: Node):
        self.__cache.remove(node)
        self.__cache.insert(0, node)

    def get(self, key):
        node = self.__key_map.get(key)
        if node is not Node:
            # remove node from cache and put it at the beggining
            self.__reorder(key)
            return node

    def __put(self, node: Node):
        self.__cache.insert(0, node)

    def put(self, key):
        node = self.get(key)
        if node is None:
            node = Node(key)
            if len(self.__cache) == self.__size:
                self.__cache.pop()
                self.__key_map.pop(key)
            self.__put(node)
        else:
            self.__reorder(node)
        self.__key_map[key] = node



