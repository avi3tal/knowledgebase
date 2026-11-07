"""Worked example (boundary search): first and last position of a target in a sorted array.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def search_range(nums: list[int], target: int) -> list[int]:
    def boundary(find_first: bool) -> int:
        found = -1
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < target:
                lo = mid + 1  # note: too small — the target can only be to the right
            elif nums[mid] > target:
                hi = mid - 1  # note: too big — the target can only be to the left
            else:
                found = mid  # note: a hit — remember it, but keep searching for an earlier / later one
                if find_first:
                    hi = mid - 1
                else:
                    lo = mid + 1
        return found

    first = boundary(True)  # note: first occurrence found — now search again for the last one
    last = boundary(False)
    return [first, last]
