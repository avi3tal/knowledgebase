"""Worked example (counting without a map): Boyer-Moore majority vote.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def majority_element(nums: list[int]) -> int:
    candidate = nums[0]
    count = 0  # note: votes for the candidate not yet cancelled by a different value
    for x in nums:
        if count == 0:
            candidate = x  # note: every earlier vote cancelled out — x becomes the new candidate
        if x == candidate:
            count += 1  # note: a vote for the candidate
        else:
            count -= 1  # note: a different value cancels one vote for the candidate
    return candidate  # note: a strict majority can't be cancelled completely, so it survives
