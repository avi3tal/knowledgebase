"""Worked example (splicing): insertion sort on a singly linked list, O(1) extra space.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next


def insertion_sort_list(head):
    dummy = ListNode(0)  # note: dummy heads the sorted list we build; it starts empty
    curr = head
    while curr is not None:
        nxt = curr.next  # note: save the rest of the unsorted list before we rewire curr
        prev = dummy
        while prev.next is not None and prev.next.val < curr.val:
            prev = prev.next  # note: walk the sorted list to the last node smaller than curr
        curr.next = prev.next  # note: splice step 1: curr points at what follows prev
        prev.next = curr  # note: splice step 2: prev points at curr — order matters
        curr = nxt  # note: move on to the next unsorted node
    return dummy.next
