"""Worked example (prefix sums): answer inclusive range-sum queries in O(1) each.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def range_sums(nums: list[int], queries: list[list[int]]) -> list[int]:
    prefix = [0] * (len(nums) + 1)  # note: prefix[i] = sum of the first i elements; prefix[0] = 0 is the empty prefix
    for i in range(len(nums)):
        prefix[i + 1] = prefix[i] + nums[i]  # note: each prefix extends the previous one by a single element
    answers = []
    for left, right in queries:
        end = right + 1
        answers.append(prefix[end] - prefix[left])  # note: sum(nums[left..right]) = prefix[right + 1] - prefix[left]
    return answers
