"""Worked example: reverse the sub-list from position p to q (1-based) in place.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def reverse_sublist(head, p: int, q: int):
    if p == q:
        return head
    before, curr = None, head
    for _ in range(p - 1):  # note: walk to node p; `before` is the node just in front of it
        before, curr = curr, curr.next
    sub_tail = curr  # note: node p becomes the TAIL of the reversed part — remember it
    prev = None
    for _ in range(q - p + 1):  # note: reverse exactly q - p + 1 links
        nxt = curr.next  # note: save the rest of the list before cutting the link
        curr.next = prev  # note: flip: curr now points backwards
        prev, curr = curr, nxt  # note: step both pointers forward
    if before is not None:
        before.next = prev  # note: reconnect: the node before p points to the new front (old node q)
    else:
        head = prev  # note: p was 1 — the reversed part's front is the new head
    sub_tail.next = curr  # note: reconnect: old node p points to the node after q
    return head
