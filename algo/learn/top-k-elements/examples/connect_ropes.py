"""Worked example (top K, repeated extraction): minimum cost to connect ropes.

Joining two ropes costs the sum of their lengths, and the joined rope can be joined again.
Short ropes get re-paid in every later join, so always join the two shortest: pop the two
smallest from a min-heap and push their sum back.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def connect_ropes(ropes: list[int]) -> int:
    heap = list(ropes)
    heapq.heapify(heap)  # note: heapify builds the min-heap in O(n), faster than n pushes
    total = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)  # note: shortest rope
        b = heapq.heappop(heap)  # note: second shortest rope
        joined = a + b
        total += joined  # note: pay for this join
        heapq.heappush(heap, joined)  # note: the joined rope goes back and may be joined again
    return total
