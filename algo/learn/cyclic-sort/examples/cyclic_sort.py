"""Worked example: cyclic sort — sort an array holding each of 1..n exactly once, in place.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def cyclic_sort(nums: list[int]) -> list[int]:
    i = 0
    while i < len(nums):
        j = nums[i] - 1  # note: value v belongs at index v - 1 — j is the home of nums[i]
        if nums[i] != nums[j]:
            nums[i], nums[j] = nums[j], nums[i]  # note: swap it home; don't move i — re-check what landed here
        else:
            i += 1  # note: nums[i] is at its home — move on
    return nums  # note: every swap placed one value for good, so at most n - 1 swaps in total
