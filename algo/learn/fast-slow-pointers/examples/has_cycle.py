"""Worked example (Floyd's cycle detection): does a singly linked list contain a cycle?

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def has_cycle(head) -> bool:
    slow = fast = head  # note: tortoise and hare both start at the head
    while fast is not None and fast.next is not None:  # note: the hare needs two nodes ahead of it to jump
        slow = slow.next  # note: tortoise moves 1 step
        fast = fast.next.next  # note: hare moves 2 steps, so the gap grows by 1 each round
        if slow is fast:
            return True  # note: same node (identity, not value) — the hare lapped the tortoise inside a cycle
    return False  # note: the hare ran off the end — a list with a tail end has no cycle
