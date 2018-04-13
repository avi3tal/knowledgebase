from ds.linkedList.linkedlist import LinkedList


class Node(object):
    def __init__(self, data):
        self.data = data
        self.next_node = None
        self.prev_node = None

    def __repr__(self):
        return "<Node {}>".format(self.data)


class DoublyLinkedList(LinkedList):

    def remove_first(self):
        if self._head is not None:
            self._size -= 1
            self._head = self._head.next_node
            self._head.prev_node = None

    def remove(self, index):
        if index == 0:
            self.remove_first()
        elif index == self.size-1:
            self.remove_last()
        else:
            current_node = self._head
            counter = 0
            while counter != index:
                counter += 1
                current_node = current_node.next_node
            current_node.prev_node.next_node = current_node.next_node

    # O(n)
    def add_last(self, data):
        if self._head is not None:
            self._size += 1
            current_node = self._head
            new_node = Node(data)
            while current_node.next_node is not None:
                current_node = current_node.next_node
            current_node.next_node = new_node
            new_node.prev_node = current_node

    # O(n)
    def add(self, index, data):
        self._verify_in_range(index)

        if index == 0:
            self.add_first(data)
        elif index == self.size-1:
            self.add_last(data)
        else:
            self._size += 1
            current_node = self._head
            previous_node = None
            new_node = Node(data)
            counter = 0
            while counter != index:
                counter += 1
                previous_node = current_node
                current_node = current_node.next_node
            new_node.next_node = current_node
            new_node.prev_node = previous_node


if __name__ == "__main__":
    linked_list = DoublyLinkedList()

    for node in linked_list.iterate():
        print(node)

    linked_list.add(0, 11)
    linked_list.add(1, 12)
    linked_list.add_last(13)
    linked_list.add_first(10)

    for node in linked_list.iterate():
        print(node)

    print(linked_list.get_first())
    print(linked_list.get(1))

    linked_list.remove(0)
    for node in linked_list.iterate():
        print(node)