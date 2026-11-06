"""Worked example (same direction): remove duplicates from a sorted array in place.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    write = 1  # note: nums[0] is always kept — write marks the end of the kept prefix
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:  # note: compare with the last kept value, not the previous read
            nums[write] = nums[read]  # note: new value — copy it to the write slot and grow the kept prefix
            write += 1
    return write  # note: the first `write` elements are the unique values
