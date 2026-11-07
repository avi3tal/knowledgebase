"""Worked example (merge into a sorted list): insert a new interval and merge overlaps.

The input is already sorted by start and non-overlapping, so one left-to-right sweep is enough:
copy what ends before the new interval, absorb what overlaps it, copy the rest.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def insert(intervals: list[list[int]], new: list[int]) -> list[list[int]]:
    merged: list[list[int]] = []
    start, end = new  # note: the new interval grows as it swallows overlapping ones
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < start:  # note: phase 1 — ends before the new interval starts: no overlap
        merged.append(intervals[i])  # note: copy it unchanged
        i += 1
    while i < n and intervals[i][0] <= end:  # note: phase 2 — starts before the new interval ends: overlap
        start = min(start, intervals[i][0])  # note: absorb it: stretch the new interval to cover both
        end = max(end, intervals[i][1])
        i += 1
    merged.append([start, end])  # note: no more overlaps — the grown interval is final
    while i < n:  # note: phase 3 — everything left starts after the new interval ends
        merged.append(intervals[i])
        i += 1
    return merged
