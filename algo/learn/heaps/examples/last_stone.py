"""Worked example (max-heap via negation): smash the two heaviest stones until at most one is left.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def last_stone_weight(stones: list[int]) -> int:
    heap = [-s for s in stones]  # note: heapq is a MIN-heap — store negatives so the heaviest is on top
    heapq.heapify(heap)  # note: heapify rearranges the list into heap order in O(n)
    while len(heap) > 1:
        first = -heapq.heappop(heap)  # note: pop the heaviest (O(log n)) — negate back to get the weight
        second = -heapq.heappop(heap)  # note: …and the second heaviest
        if first != second:
            heapq.heappush(heap, -(first - second))  # note: push the leftover piece; it sifts up to its place
    return -heap[0] if heap else 0
