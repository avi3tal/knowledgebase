"""Worked example (top K): the k-th smallest number in an unsorted array.

Keep only the k smallest numbers seen so far in a size-k MAX-heap. Its top is the largest of
the kept ones, the first to go when something smaller arrives. heapq is a min-heap, so the
numbers are stored NEGATED: the heap view shows -x, and `kth` mirrors the real top value.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def kth_smallest(nums: list[int], k: int) -> int:
    heap: list[int] = []  # max-heap of the k smallest so far, stored as negatives
    for i in range(len(nums)):
        x = nums[i]
        if len(heap) < k:
            heapq.heappush(heap, -x)  # note: fewer than k kept: push -x (negated so the min-heap acts as a max-heap)
        elif x < -heap[0]:
            heapq.heapreplace(heap, -x)  # note: x beats the largest kept number: evict the top, push -x
        kth = -heap[0]  # note: the top, un-negated, is the largest of the kept numbers
    return kth  # note: after the scan the heap holds exactly the k smallest, so its top is the k-th smallest
