"""Worked example (cycle in an implicit sequence): is n a happy number?

The sequence n → sum of squared digits → … either reaches 1 or loops forever. There is no
list in memory: `next_of` *is* the `.next` pointer, so Floyd works with O(1) extra space.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def is_happy(n: int) -> bool:
    def next_of(x: int) -> int:
        total = 0
        while x > 0:
            x, digit = divmod(x, 10)
            total += digit * digit
        return total

    slow, fast = n, next_of(n)  # note: the "list" is implicit: next_of(x) plays the role of x.next
    while fast != 1 and slow != fast:  # note: stop when the hare reaches 1 or catches the tortoise
        slow = next_of(slow)  # note: tortoise: one hop along the sequence
        fast = next_of(next_of(fast))  # note: hare: two hops
    return fast == 1  # note: reached 1 → happy; met somewhere else → stuck in a loop that never hits 1
