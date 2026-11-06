"""Worked example (fixed-size window): maximum sum of any contiguous subarray of size k.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def max_sum_size_k(nums: list[int], k: int) -> int:
    window_sum, max_sum = 0, float("-inf")
    window_start = 0
    for window_end in range(len(nums)):
        window_sum += nums[window_end]  # note: grow — add the element entering on the right
        if window_end - window_start + 1 == k:
            max_sum = max(max_sum, window_sum)  # note: window has k elements — record its sum
            window_sum -= nums[window_start]  # note: slide — subtract the element leaving on the left
            window_start += 1
    return max_sum
