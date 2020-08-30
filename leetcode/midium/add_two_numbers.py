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
    while l1 or l2:
        x = y = 0
        if l1:
            x = l1.val
            l1 = l1.next
        if l2:
            y = l2.val
            l2 = l2.next

        s = x + y + addition
        addition = s // 10
        res.next = ListNode(s % 10)
        res = res.next

    if addition:
        res.next = ListNode(addition)
    return dummy.next


a = add_two_numbers(ListNode(2, ListNode(4, ListNode(3))), ListNode(5, ListNode(6, ListNode(4, ListNode(5)))))
while a:
    print(a.val)
    a = a.next

# a = add_two_numbers(ListNode(1), ListNode(9, ListNode(9)))
while a:
    print(a.val)
    a = a.next