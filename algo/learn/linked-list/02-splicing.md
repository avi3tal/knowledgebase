# Splicing, building and rewiring

Most medium list problems are combinations of a few techniques:

- **Build a new list with a dummy + tail.** Append by `tail.next = node; tail = node`. You can
  build several lists at once (one dummy per group) and join them at the end. This is how you
  partition or interleave lists in O(1) extra space.
- **Splice nodes from one list into another.** Save `nxt = curr.next` first, then rewire. If you
  rewire first, you lose the rest of the list.
- **Two pointers at different speeds** (fast & slow): find the middle, detect a cycle, or find
  the k-th node from the end in one pass. That's its own pattern (Fast & Slow Pointers).
- **Reverse links in place** with `prev / curr / nxt`. That's its own pattern (In-place Reversal
  of a LinkedList).
- **Carry state while walking two lists** in lock-step, e.g. digits with a carry. Loop while
  *either* list or the carry is non-empty.

## The splice

```figure
splice-order
```

Do the steps in that order. Doing step 2 first makes `prev.next` point at `curr`, and step 1
then creates a self-loop.

## Example: insertion sort on a list

The sorted part grows behind a dummy. For each unsorted node, walk the sorted part to find where
it belongs and splice it in. No node is copied, and no new node is created except the dummy.
It's O(n²) time in the worst case, but O(1) extra space and a good drill for the save → rewire →
advance rhythm.
