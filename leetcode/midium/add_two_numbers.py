"""
https://leetcode.com/problems/add-two-numbers/
"""


# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def add_two_numbers(l1: ListNode, l2: ListNode) -> ListNode:
    dummy = res = ListNode(None)
    addition = 0
    while l1 and l2:
        s = l1.val + l2.val + addition
        if s >= 10:
            res.next = ListNode(s - 10)
            addition = 1
        else:
            addition = 0
            res.next = ListNode(s)
        res = res.next
        l1 = l1.next
        l2 = l2.next

    if l1:
        res.next = l1
    elif l2:
        res.next = l2
    return dummy.next


a = add_two_numbers(ListNode(2, ListNode(4, ListNode(3))), ListNode(5, ListNode(6, ListNode(4, ListNode(5)))))
while a:
    print(a.val)
    a = a.next
