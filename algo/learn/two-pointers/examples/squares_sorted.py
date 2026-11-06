"""Worked example (opposite ends): squares of a sorted array, returned sorted.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def sorted_squares(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [0] * n  # note: the largest square is at one of the two ends — fill result from the back
    left, right = 0, n - 1
    for fill in range(n - 1, -1, -1):
        left_sq, right_sq = nums[left] ** 2, nums[right] ** 2
        if left_sq > right_sq:
            result[fill] = left_sq  # note: left end has the bigger square — place it and move left inward
            left += 1
        else:
            result[fill] = right_sq  # note: right end wins (or ties) — place it and move right inward
            right -= 1
    return result
