"""Worked example (place, then scan): find the corrupt pair.

The array should hold 1..n, but one number was overwritten by a copy of another, so one value is
duplicated and one is missing. Return [duplicate, missing].

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def find_corrupt_pair(nums: list[int]) -> list[int]:
    i = 0
    while i < len(nums):
        j = nums[i] - 1
        if nums[i] != nums[j]:
            nums[i], nums[j] = nums[j], nums[i]  # note: phase 1 — swap each value to its home index
        else:
            i += 1  # note: at home, or its home is already taken by an equal value (a duplicate) — move on
    for k in range(len(nums)):
        if nums[k] != k + 1:  # note: phase 2 — the first misplaced slot tells both answers
            return [nums[k], k + 1]  # note: the extra copy sits in the slot of the missing value
    return [-1, -1]
