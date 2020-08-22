"""
https://leetcode.com/problems/two-sum/
"""
from typing import List


def ordered_two_sum(nums: List[int], target: int) -> List[int]:
    """
    Time: O(n)
    Space: O(1)
    """
    i = 0
    j = len(nums) - 1
    while i < j:
        val = nums[i] + nums[j]
        if val == target:
            return [i, j]
        if val > target:
            j -= 1
        else:
            i += i
    return []


def two_sum(nums: List[int], target: int) -> List[int]:
    """
    Time: O(n)
    Space: O(n)
    """
    m = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in m:
            return [m[diff], i]
        m[n] = i
    return []


# print(ordered_two_sum([2, 7, 11, 15], 9))
print(two_sum([2, 7, 11, 15], 9))