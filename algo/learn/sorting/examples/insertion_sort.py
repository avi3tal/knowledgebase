"""Worked example (insertion sort): grow a sorted prefix by sliding each element into place.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def insertion_sort(nums: list[int]) -> list[int]:
    nums = list(nums)
    for i in range(1, len(nums)):
        key = nums[i]  # note: the next element to place; nums[0..i-1] is already sorted
        j = i - 1
        while j >= 0 and nums[j] > key:
            nums[j + 1] = nums[j]  # note: a larger element shifts one step right to open a gap
            j -= 1
        nums[j + 1] = key  # note: drop key into the gap — the prefix nums[0..i] is sorted now
    return nums
