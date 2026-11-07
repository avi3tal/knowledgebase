from __future__ import annotations

import heapq


class KthLargest:
    def __init__(self, k: int, nums: list[int]) -> None:
        self.k, self.heap = k, []
        for x in nums:
            self.add(x)

    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]
