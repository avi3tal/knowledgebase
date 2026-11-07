"""Worked example (stable counting sort): sort integers in the range 0..max_value without comparisons.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def counting_sort(nums: list[int], max_value: int) -> list[int]:
    counts = [0] * (max_value + 1)
    for x in nums:
        counts[x] += 1  # note: tally each value — the value itself is the index
    start = 0
    for v in range(max_value + 1):
        counts[v], start = start, start + counts[v]  # note: prefix sum: counts[v] becomes the first output slot for v
    output = [0] * len(nums)
    for x in nums:
        output[counts[x]] = x  # note: place x in its slot; scanning left to right keeps equal values stable
        counts[x] += 1
    return output
