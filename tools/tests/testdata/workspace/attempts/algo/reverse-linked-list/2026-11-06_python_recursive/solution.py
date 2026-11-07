"""Recursive reversal: correct, but recursion depth ~n (bench must stop cleanly)."""

from __future__ import annotations

from kb.structs import ListNode


def reverse_list(head: ListNode | None) -> ListNode | None:
    if head is None or head.next is None:
        return head
    new_head = reverse_list(head.next)
    head.next.next = head
    head.next = None
    return new_head
