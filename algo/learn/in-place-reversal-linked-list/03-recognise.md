## How to recognise it

**Strong signals:**
- A **singly linked list** and the word **reverse**: the whole list, "between positions left
  and right", "every k nodes", "alternating k-blocks".
- **O(1) extra space** with a list. You can't copy the values into an array or onto a stack.
- A task that needs to walk the list **backwards** from some point: is it a palindrome,
  interleave the first half with the reversed second half, add numbers stored most-significant
  digit first.
- **Rotate** or **re-order** the list in place. It's the same pointer rewiring, without
  allocating new nodes.

**Anti-signals: it looks similar, but it's a different pattern:**
- **Find** a position (middle, k-th from the end, cycle start) without changing any links →
  **Fast & Slow Pointers**. Reversal problems often *use* fast/slow to find the split point,
  but the rewiring is this pattern.
- **Merge** two sorted lists, remove the n-th node, or delete duplicates → **Linked List
  Basics** (a dummy head plus splicing). Arrows are redirected, but nothing is turned around.
- **Reverse an array or string** → **Two Pointers** swapping from both ends. Arrays have
  indices, so there are no arrows to flip.
- Merge **k** sorted lists → **K-way Merge** (a heap of list heads).

**Complexity:**
- Time **O(n)**. Each node's `next` is flipped once (k-group reversal also scans each block
  once to check it's full, which is still O(n)).
- Space **O(1)**: `prev`, `curr`, `nxt` and a few border pointers. Recursive reversal is O(n)
  stack.

**Common pitfalls:**
- **Losing the rest of the list:** always `nxt = curr.next` *before* `curr.next = prev`.
- **Forgetting a reconnection:** a sub-list reversal has **two** borders. `before.next` must
  point to the new front, and the old front (`sub_tail`) must point to the node after the
  block. If you miss one, the list is cut or loops.
- **The head changes:** when `p == 1`, or for the first k-group, there's no `before` node. Use
  a dummy head, or handle `head = prev` explicitly.
- **Counting:** reversing positions `p..q` takes `q − p + 1` flips. Walking to `before` takes
  `p − 1` steps from the head (or `p − 1` from a dummy, giving the node *before* p).
- **Short last block:** in k-group reversal, check that `k` nodes exist *before* you start
  flipping. Otherwise you have to un-reverse.
