"""Worked example (same direction, swap): move every zero to the end, keeping the order of the rest.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def move_zeroes(nums: list[int]) -> list[int]:
    write = 0  # note: invariant — nums[0..write-1] holds the non-zeros seen so far, in order
    for read in range(len(nums)):
        if nums[read] != 0:  # note: a keeper — it belongs at the write slot
            nums[write], nums[read] = nums[read], nums[write]  # note: swap the keeper left, the zero right
            write += 1  # note: the kept prefix grows by one
        # zero: do nothing, read moves on and the zero stays between write and read
    return nums  # note: everything from write onward is a zero
