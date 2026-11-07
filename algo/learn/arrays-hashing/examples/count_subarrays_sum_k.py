"""Worked example (prefix sums + hash map): count subarrays whose sum is exactly k.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def count_subarrays_sum_k(nums: list[int], k: int) -> int:
    seen = {0: 1}  # note: the empty prefix (sum 0) has been seen once
    prefix, count = 0, 0
    for i in range(len(nums)):
        prefix += nums[i]  # note: prefix = sum of nums[0..i]
        need = prefix - k  # note: a subarray ending at i sums to k iff an earlier prefix equals prefix - k
        count += seen.get(need, 0)  # note: every earlier prefix equal to `need` starts one such subarray
        seen[prefix] = seen.get(prefix, 0) + 1  # note: record this prefix for the indices still to come
    return count
