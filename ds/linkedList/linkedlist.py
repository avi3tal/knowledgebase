
class Node(object):
    def __init__(self, data):
        self.data = data
        self.next_node = None

    def __repr__(self):
        return "<Node {}>".format(self.data)


class LinkedList(object):
    def __init__(self):
        self.__size = 0
        self.__head = None

    def __verify_in_range(self, index):
        if index > self.size:
            if self.size == 0:
                msg = "{} is out of range. list is empty".format(index)
            else:
                msg = "{} is out of range. last index is {}".format(index, self.size-1)
            raise IndexError(msg)

    @property
    def size(self):
        return self.__size

    # O(1)
    def add_first(self, data):
        self.__size += 1
        new_node = Node(data)
        if self.__head is not None:
            new_node.next_node = self.__head
        self.__head = new_node

    # O(n)
    def add_last(self, data):
        if self.__head is not None:
            self.__size += 1
            current_node = self.__head
            new_node = Node(data)
            while current_node.next_node is not None:
                current_node = current_node.next_node

            current_node.next_node = new_node

    # O(n)
    def add(self, index, data):

        self.__verify_in_range(index)

        if index == 0:
            self.add_first(data)
        elif index == self.size-1:
            self.add_last(data)
        else:
            self.__size += 1
            current_node = self.__head
            previous_node = None

            new_node = Node(data)
            counter = 0
            while counter != index:
                counter += 1
                previous_node = current_node
                current_node = current_node.next_node
            new_node.next_node = current_node
            previous_node.next_node = new_node

    def iterate(self):
        current_node = self.__head
        if current_node is not None:
            counter = 0
            while counter < self.size:
                yield current_node
                current_node = current_node.next_node
                counter += 1

    def get_first(self):
        return self.__head

    def get_last(self):
        if self.__head is not None:
            current_node = self.__head
            while current_node.next_node is not None:
                current_node = current_node.next_node
            return current_node
        else:
            return self.__head

    def get(self, index):
        self.__verify_in_range(index)

        if index == 0:
            return self.get_first()
        elif index == self.size-1:
            return self.get_last()
        else:
            current_node = self.__head
            counter = 0
            while counter != index:
                counter += 1
                current_node = current_node.next_node
            return current_node

    def remove_first(self):
        if self.__head is not None:
            self.__size -= 1
            self.__head = self.__head.next_node

    def remove_last(self):
        if self.__head is not None:
            self.__size -= 1
            current_node = self.__head
            while current_node.next_node is not None:
                current_node = current_node.next_node
            current_node.next_node = None

    def remove(self, index):
        self.__verify_in_range(index)

        if index == 0:
            self.remove_first()
        elif index == self.size-1:
            self.remove_last()
        else:
            current_node = self.__head
            previous_node = None
            counter = 0
            while counter != index:
                counter += 1
                previous_node = current_node
                current_node = current_node.next_node
            previous_node.next_node = current_node.next_node


if __name__ == "__main__":
    linked_list = LinkedList()

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

