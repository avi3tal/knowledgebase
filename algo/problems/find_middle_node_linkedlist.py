"""
O(n)
"""

from ds.linkedList.linkedlist import LinkedList


def find_middle_node_linkedlist(l):
    node = l.get_first()
    single = double = node

    while single.next_node is not None and double.next_node is not None:
        single = single.next_node
        double = double.next_node.next_node
        if double is None:
            break
    return single


if __name__ == "__main__":
    values = ["a", "b", "c", "d", "e", "f", "g", "h"]
    llist = LinkedList()
    [llist.add_last(x) for x in values]

    print(find_middle_node_linkedlist(llist).data)
