"""
Given a sorted linked list, delete all duplicates such that each element appear only once.

For example,
Given 1->1->2, return 1->2.
Given 1->1->2->3->3, return 1->2->3.
"""

# Definition for singly-linked list.
# class ListNode:
#    def __init__(self, x):
#        self.val = x
#        self.next = None

class Solution:
    # @param A : head node of linked list
    # @return the head node in the linked list
    def deleteDuplicates(self, A):
        if A is None:
            return A

        start = A

        while A is not None:
            if A.next is not None:
                temp = A.next
                while temp is not None and temp.val == A.val:
                    A.next = temp.next
                    temp = temp.next
            A = A.next

        return start


if __name__ == "__main__":
    from interviewbit.courses.programming.linked_list.base import ListNode, Node


    def printll(node: Node):
        while node is not None:
            print(node.val, end=" -> ")
            node = node.next


    s = Solution()

    ll = ListNode()
    ll.head = Node(1)
    ll.head.next = Node(1)
    ll.head.next.next = Node(2)
    ll.head.next.next.next = Node(3)
    ll.head.next.next.next.next = Node(3)
    ll.head.next.next.next.next.next = Node(3)
    ll.head.next.next.next.next.next.next = Node(3)

    printll(ll.head)
    print()
    printll(s.deleteDuplicates(ll.head))
    print()
    ll = ListNode()
    ll.head = Node(1)
    ll.head.next = Node(1)
    ll.head.next.next = Node(2)

    printll(ll.head)
    print()
    printll(s.deleteDuplicates(ll.head))