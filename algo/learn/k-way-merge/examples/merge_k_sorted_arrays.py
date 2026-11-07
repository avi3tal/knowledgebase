"""Worked example (k-way merge): merge k sorted arrays into one sorted array.

The heap holds one entry per array: (value, array index, element index), its smallest
unconsumed element. Pop the global minimum, then push that array's next element. The heap
never holds more than k entries. `taken` lists the consumed (row, col) cells for the grid view.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def merge_k_sorted(arrays: list[list[int]]) -> list[int]:
    heap: list[tuple[int, int, int]] = []
    for i in range(len(arrays)):
        if arrays[i]:
            heapq.heappush(heap, (arrays[i][0], i, 0))  # note: seed with each array's head: (value, array, index)
    merged: list[int] = []
    taken: list[tuple[int, int]] = []
    while heap:
        value, i, j = heapq.heappop(heap)  # note: the smallest head across all arrays is the next output
        merged.append(value)
        taken.append((i, j))
        if j + 1 < len(arrays[i]):
            heapq.heappush(heap, (arrays[i][j + 1], i, j + 1))  # note: refill from the same array (its new head)
    return merged
