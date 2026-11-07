"""Worked example (prefix sums + hash map): count subarrays whose sum is divisible by k.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def subarrays_div_by_k(nums: list[int], k: int) -> int:
    seen = {0: 1}  # note: remainder of the empty prefix — lets subarrays that start at index 0 count
    prefix, count = 0, 0
    for i in range(len(nums)):
        prefix += nums[i]
        mod = prefix % k  # note: Python's % is never negative, even for negative prefixes
        count += seen.get(mod, 0)  # note: every earlier prefix with the same remainder closes a subarray divisible by k
        seen[mod] = seen.get(mod, 0) + 1  # note: insert AFTER the lookup
    return count
