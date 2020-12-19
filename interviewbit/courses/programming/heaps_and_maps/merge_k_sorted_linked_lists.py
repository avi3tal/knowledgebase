from heapq import heapify, heappop, heappush


class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

    def __lt__(self, other):
        return self.val < other.val


def merge_k_linked_lists(lsts):
    heap = list(lsts)
    heapify(heap)

    ref = Node(0)
    tail = None

    while heap:
        lowest = heap[0]
        heappop(heap)
        if lowest.next is not None:
            heappush(heap, lowest.next)

        if ref.next is None:
            ref.next = lowest
        else:
            tail.next = lowest
        tail = lowest
    return ref.next


def print_list(head):
    while head is not None:
        print(head.val, end="->")
        head = head.next
    print()


l1 = Node(1, Node(4, Node(5)))
l2 = Node(1, Node(3, Node(4)))
l3 = Node(2, Node(6))
# print_list(l1)
# print_list(l2)
# print_list(l3)

print_list(merge_k_linked_lists([l1, l2, l3]))
