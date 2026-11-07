"""Worked example (dummy head + delete): remove every node whose value equals `target`.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next


def remove_value(head, target: int):
    dummy = ListNode(
        0, head
    )  # note: a dummy node (value 0) in front of head: even the first real node now has a predecessor
    prev, curr = dummy, head
    while curr is not None:
        if curr.val == target:
            prev.next = curr.next  # note: unlink: prev skips over curr (prev does NOT move)
        else:
            prev = curr  # note: keep curr — it becomes the new predecessor
        curr = curr.next  # note: always advance curr
    return dummy.next  # note: the real head may have changed; dummy.next always knows it
