# In-place Reversal of a LinkedList

> Pattern #7 · Data structures: singly linked list

A singly linked list only points **forward**. Many tasks need part of it backwards: reverse
the whole list, reverse positions `p..q`, reverse every `k` nodes, compare the second half
with the first. The easy way out is to copy the values into an array (O(n) space) or push
nodes onto a stack. Interviews usually ask for **O(1) extra space**.

**The insight:** you don't move nodes, you **flip arrows**. Walk the list once with three
pointers. `prev` is the part already reversed, `curr` is the node you're flipping, and `nxt`
is the rest of the list, saved before you cut the link that leads to it.

```
before:   None   1 → 2 → 3 → 4 → None
          prev  curr

step:     nxt = curr.next          save the rest (2 → 3 → 4)
          curr.next = prev         flip:  None ← 1
          prev, curr = curr, nxt   advance both

after 1:  None ← 1    2 → 3 → 4 → None
                prev curr
after 4:  None ← 1 ← 2 ← 3 ← 4    curr = None
                              prev = new head
```

## The template: reverse a whole list

```python
prev, curr = None, head
while curr is not None:
    nxt = curr.next          # 1. save the rest of the list
    curr.next = prev         # 2. flip the arrow
    prev = curr              # 3. advance prev ...
    curr = nxt               #    ... and curr
return prev                  # curr fell off the end; prev is the old tail
```

- **Order matters.** Save `nxt` *before* overwriting `curr.next`, or you lose the rest of the
  list.
- Every node is visited once and you keep only three pointers. That's O(n) time and O(1) space.
- The old head ends up as the new tail, and it points to whatever `prev` started as (`None`
  here). In the sub-list version, that starting value is what you reconnect.

## Reversing a piece in the middle: two reconnections

Reversing nodes `p..q` is the same loop, run exactly `q − p + 1` times. The extra work is at
the borders. Before the loop, remember two nodes:
- **`before`**: the node in front of position `p` (or `None` if `p` is 1).
- **`sub_tail`**: node `p` itself. After the reversal it becomes the **last** node of the
  reversed part.

When the loop ends, `prev` is the new **front** of the reversed part (old node `q`) and `curr` is
the node right **after** `q`. Two assignments stitch the list back together:

```
before.next = prev        # or head = prev when p == 1
sub_tail.next = curr
```

Step through it below on `1 → … → 8` with `p = 2` and `q = 6`. Watch `sub_tail` (node 2) point
at `None` in the middle of the trace. The list is temporarily broken in two, and both pieces stay
reachable only through the pointers, until the two reconnections at the end.
