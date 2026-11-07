# How to recognise it

**Strong signals:**
- The input is a `ListNode head`, and the task is to **remove, insert, merge, partition,
  reorder, or add** nodes.
- "Do it in O(1) extra space": you're expected to **rewire pointers**, not copy values into an
  array.
- The head might change (it gets deleted, or the list gets reordered) → use a **dummy head**.
- You need O(1) insert/delete in the middle plus O(1) lookup → **hash map + doubly linked list**.

**Anti-signals: it looks similar, but it's a different pattern:**
- "Middle", "cycle", "k-th from the end", "is it a palindrome" → **Fast & Slow Pointers** (two
  speeds, one pass).
- "Reverse the list / a sub-list / every k nodes" → **In-place Reversal of a LinkedList**.
- "Merge k sorted lists" → **K-way Merge**: a min-heap of the k current heads, not repeated
  pairwise merges.
- A plain array input with "insert / remove": the array is usually fine, and a linked list is
  only the answer when you need O(1) middle operations.

**Complexity:**
- One traversal is O(n) time and O(1) space. Copying into a list to "make it easier" costs O(n)
  space, so say so if you do it.
- A recursive solution on a list uses O(n) call-stack space, and Python's default recursion
  limit is about 1000.

**Common pitfalls:**
- Losing the rest of the list: always save `nxt = curr.next` before changing `curr.next`.
- Advancing `prev` after a delete. When you unlink `curr`, `prev` stays where it is.
- Returning `head` instead of `dummy.next` after the first node changed.
- Forgetting to terminate the new tail (`tail.next = None`), which leaves a cycle or a stale
  tail.
- Dereferencing `None`: check `curr` (and `curr.next` when you look two ahead) in the loop
  condition.
