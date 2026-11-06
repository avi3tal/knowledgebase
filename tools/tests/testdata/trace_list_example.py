"""Linked-list reference for the trace contract fixture (shared by pytest and vitest)."""


def reverse(head):
    prev = None
    curr = head
    while curr is not None:
        nxt = curr.next
        curr.next = prev  # note: flip the link
        prev = curr
        curr = nxt
    return prev
