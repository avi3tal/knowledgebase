## Variant 1: reverse every k-group

Split the list into blocks of `k` and reverse each block in place. It's the sub-list reversal
in a loop. The border bookkeeping becomes "the tail of the previous block points to the new
front of this block":

```
dummy → [block 1] → [block 2] → … → [short tail]
          ▲ group_prev points at the node before the current block

repeat:
    look k nodes ahead of group_prev; fewer than k left? stop
    reverse the k nodes with the template, starting prev at the node AFTER the block
    group_prev.next = the block's new front (its old k-th node)
    group_prev = the block's new last node (its old first node)
```

- A **dummy head** removes the special case "the first block changes the head".
- Starting `prev` at the node **after** the block (instead of `None`) makes the reversed block
  already point to the rest of the list. That's one reconnection saved.
- Check that a **full** block exists *before* reversing. Most versions leave a short last block
  unchanged.

## Variant 2: rotate (re-link, don't reverse)

"Rotate the list right by `k`" sounds like reversal (the array version uses three reversals),
but on a list it's cheaper to **re-link**:
1. Walk to the tail and count the length `n`. Link `tail.next = head` to close a ring.
2. `k %= n`. The new tail is `n − k − 1` steps from the old head.
3. The new head is `new_tail.next`. Cut the ring with `new_tail.next = None`.

It's the same skill (rewire `next` pointers in place, no copies), but there are no backwards
arrows.

## Variant 3: reverse half, then compare or weave

Fast & slow pointers find the **middle**. Reversal then turns the second half around so you can
walk it from the end:
- **Palindrome list:** reverse the second half, then compare node by node with the first half.
  Restore it afterwards if the caller still needs the list.
- **Reorder `L0 → Ln → L1 → Ln−1 …`:** split at the middle, reverse the second half, then merge
  the two halves by alternating nodes.

The reversal here is the plain whole-list template, applied to `slow.next`.

## Recursion: elegant, but not O(1)

```python
def reverse(node):
    if node is None or node.next is None:
        return node
    new_head = reverse(node.next)
    node.next.next = node                 # the next node points back at me
    node.next = None
    return new_head
```

It's correct, and a nice exercise, but it uses an O(n) call stack, so it's **not** in-place in
the O(1)-space sense. Long lists can also overflow the stack.
