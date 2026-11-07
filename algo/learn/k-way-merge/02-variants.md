## Variant 1: stop early at the k-th smallest

To find the **k-th smallest** across the lists, run the merge and stop after k pops. That's
O(k log m) for m lists, and you never touch elements past the k-th.
- **k-th smallest in m sorted lists:** exactly that.
- **k-th smallest in a sorted matrix** (rows and columns sorted): each **row** is a sorted list.
  Seed the heap with the first column (the first `min(n, k)` rows are enough), pop k times, and
  push the right-hand neighbour each time. O(min(n, k) + k log n).
- **k pairs with the smallest sums** from two sorted arrays: list `i` is `a[i] + b[0], a[i] + b[1], …`.
  It's a sorted list you generate on demand, never stored.

The lists don't have to exist in memory. All the heap needs is "give me the next element of list
`i`", which makes this work for files, streams and implicit lists.

## Variant 2: smallest range covering every list

Find the smallest `[lo, hi]` that contains at least one element from each of the k lists.
- Keep **exactly one element from each list** in the heap, and also track the **maximum** of
  those elements.
- The current range is `[heap top, current max]`. Record it if it's smaller than the best so far.
- Pop the minimum and push the next element of **its** list, updating the max. Moving the minimum
  up is the only move that can shrink the range.
- Stop as soon as one list runs out. Without that list you can't cover all k any more.

## Variant 3: divide and conquer (no heap)

Merge the lists in **pairs**: k → k/2 → k/4 … → 1, using the two-list merge. Every element takes
part in log k rounds, so it's also O(N log k). It needs no heap, which suits linked lists (the
merge rewires nodes in place). The heap version is easier to stop early, and it's the only one
that works for streams.

## When the lists are equal-length rows

A matrix sorted by rows **and** columns is also searchable without a heap. **Binary search on
the value**: pick `mid`, count the elements ≤ mid with a staircase walk (O(n) per count), and
narrow down. That's O(n log(max − min)), with O(1) space. It's the modified-binary-search answer
to the same question, and good to mention as a follow-up.
