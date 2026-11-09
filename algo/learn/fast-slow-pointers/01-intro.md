# Fast & Slow Pointers

> Pattern #4 · Data structures: linked list, array, implicit sequences

Some questions about a singly linked list sound like they need extra memory or a second pass.
Does the list loop back on itself? Where is the middle? Where does the loop start? The naive
answers are a hash set of visited nodes (O(n) space) or counting the length first and then
walking again (two passes).

**The insight:** send two pointers through the same structure at **different speeds**. The
*tortoise* (`slow`) moves 1 step per round and the *hare* (`fast`) moves 2. The relationship
between them tells you what you want to know:
- If the list **ends**, the hare reaches the end first, and by then the tortoise has covered
  exactly half of it. That gives you the **middle**.
- If the list **loops**, the hare can never reach an end. It goes round the loop and catches the
  tortoise from behind. That gives you **cycle detection** with O(1) extra space.

```figure
tortoise-hare-cycle
```

## Why the hare can't jump over the tortoise: the gap argument

Once both pointers are inside a cycle of length `c`, measure the **gap**: how many steps
`fast` is *behind* `slow` along the cycle. Each round `slow` moves 1 and `fast` moves 2, so the gap
shrinks by **exactly 1**:

```text
gap:  g → g-1 → g-2 → … → 1 → 0   (meet)
```

A gap that shrinks by one at a time can't skip from 1 to −1. It must hit 0, which means the
two pointers stand on the same node. The gap starts below `c`, so they meet within `c` rounds of
the tortoise entering the cycle. The whole run is **O(n)** time and **O(1)** space.

(With speeds 1 and 3 the gap shrinks by 2 and *can* skip over 0 on an odd-length cycle. You'd
still meet eventually, but the clean proof is gone. Stick with 1 and 2.)

## The template

```python
slow = fast = head
while fast is not None and fast.next is not None:   # the hare needs 2 nodes to jump
    slow = slow.next
    fast = fast.next.next
    if slow is fast:                                 # identity, not equal values
        return True                                  # (or: handle the meeting point)
return False                                         # hare fell off the end, so no cycle
```

- Check `fast` **and** `fast.next` before the jump, or `fast.next.next` crashes on a list with
  a tail end.
- Compare nodes with `is`. Two different nodes can hold the same value.

Step through it below. The list has 12 nodes and the tail links back to node 3. The hare
enters the loop first and laps it. Watch the distance from `fast` to `slow` shrink by one each
round once both are inside.
