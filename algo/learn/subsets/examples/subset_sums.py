"""Worked example (BFS subsets): the sum of every subset of a list of numbers.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def subset_sums(nums: list[int]) -> list[int]:
    sums = [0]  # note: start from the empty subset — its sum is 0
    for num in nums:
        size = len(sums)  # note: freeze the current level — only these subsets get num added
        for i in range(size):
            sums.append(sums[i] + num)  # note: clone subset i and add num — the copy goes to the end, the old one stays
    return sums  # note: 2^n subsets, one sum each
