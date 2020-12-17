from interviewbit.courses.programming.linked_list.base import ListNode, Node


class Solution:
    # @param A : head node of linked list
    # @return the head node in the linked list
    def solve(self, A: Node):
        if not A:
            return A

        prev = Node(None)
        prev.next = A
        one = None

        while A is not None:
            if A.val and not one:
                one = A
            elif one and not A.val:
                A.val, one.val = one.val, A.val
                one = one.next
            A = A.next
        return prev.next


def printll(node: Node):
    while node is not None:
        print(node.val, end=" -> ")
        node = node.next


ll = ListNode()
ll.head = Node(1)
ll.head.next = Node(0)
ll.head.next.next = Node(0)
ll.head.next.next.next = Node(1)

printll(ll.head)
print()
s = Solution()
printll(s.solve(ll.head))

ll = ListNode()
ll.head = Node(0)
ll.head.next = Node(1)


printll(ll.head)
print()
printll(s.solve(ll.head))
