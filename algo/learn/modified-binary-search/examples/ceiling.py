"""Worked example (lower bound): the ceiling of a key in a sorted array.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def search_ceiling(nums: list[int], key: int) -> int:
    if not nums or key > nums[-1]:
        return -1  # note: key is bigger than everything — no ceiling exists
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2  # note: look at the middle of the live range [lo, hi]
        if nums[mid] < key:
            lo = mid + 1  # note: nums[mid] is too small, and so is everything left of it — drop the left half
        elif nums[mid] > key:
            hi = mid - 1  # note: nums[mid] is a candidate ceiling, but a smaller one may sit to its left
        else:
            return mid  # note: exact match — the key is its own ceiling
    return lo  # note: lo crossed hi — lo is the first index whose value is bigger than key
