"""
https://leetcode.com/problems/merge-two-sorted-lists/
"""


# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def merge_two_lists(l1: ListNode, l2: ListNode) -> ListNode:
    dummy = ans = ListNode(None)
    while l1 is not None and l2 is not None:
        if l1.val <= l2.val:
            ans.next = l1
            ans = ans.next
            l1 = l1.next
        else:
            ans.next = l2
            ans = ans.next
            l2 = l2.next
    if l1 is not None:
        ans.next = l1
    else:
        ans.next = l2
    return dummy.next




a1 = ListNode(1, ListNode(2, ListNode(4)))
a2 = ListNode(1, ListNode(3, ListNode(4)))

e = merge_two_lists(a1, a2)
while e.next is not None:
    print(e.val)
    e = e.next
