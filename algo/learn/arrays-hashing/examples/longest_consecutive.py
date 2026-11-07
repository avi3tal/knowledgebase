"""Worked example (hash set): length of the longest run of consecutive integers, in any order.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def longest_consecutive(nums: list[int]) -> int:
    seen = set(nums)  # note: one O(n) pass builds the set; membership is now O(1)
    best = 0
    for x in nums:
        if x - 1 in seen:
            continue  # note: x-1 exists, so x is not the start of a run — skip it
        length = 1  # note: x is a run start — walk upward while the next number is in the set
        while x + length in seen:
            length += 1
        best = max(best, length)  # note: every number is walked at most once overall, so the scan is O(n)
    return best
