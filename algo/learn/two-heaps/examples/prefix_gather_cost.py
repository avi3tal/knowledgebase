"""Worked example (two heaps): for every prefix of a stream, the cheapest meeting point.

Friends arrive one at a time and stand at `positions[i]` on a line. After each arrival, report
the minimum total walking distance for everyone so far to meet at one point. That point is the
median, so the running median is maintained with two heaps:
  lo: max-heap of the smaller half (stored NEGATED, because heapq is a min-heap)
  hi: min-heap of the larger half
Each half also keeps its sum, so the cost is O(1) once the median is known.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def gather_costs(positions: list[int]) -> list[int]:
    lo: list[int] = []  # max-heap via negation: -lo[0] is the largest of the small half
    hi: list[int] = []  # min-heap: hi[0] is the smallest of the large half
    lo_sum = hi_sum = 0
    costs: list[int] = []
    for x in positions:
        if not lo or x <= -lo[0]:
            heapq.heappush(lo, -x)  # note: x belongs to the small half: push -x onto the max-heap lo
            lo_sum += x
        else:
            heapq.heappush(hi, x)  # note: x is above the small half's top: push it onto the min-heap hi
            hi_sum += x
        if len(lo) > len(hi) + 1:
            moved = -heapq.heappop(lo)  # note: lo has 2 more than hi: move lo's largest across
            lo_sum -= moved
            heapq.heappush(hi, moved)
            hi_sum += moved
        elif len(hi) > len(lo):
            moved = heapq.heappop(hi)  # note: hi is bigger than lo: move hi's smallest across
            hi_sum -= moved
            heapq.heappush(lo, -moved)
            lo_sum += moved
        median = -lo[0]  # note: balanced: lo has the same size as hi or one more, so its top is a median
        below = median * len(lo) - lo_sum  # note: the small half walks up to the median
        above = hi_sum - median * len(hi)  # note: the large half walks down to the median
        cost = below + above
        costs.append(cost)
    return costs
