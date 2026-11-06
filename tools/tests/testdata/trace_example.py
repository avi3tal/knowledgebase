"""Tiny reference function for the trace contract fixture (shared by pytest and vitest)."""


def window_sums(nums: list[int], k: int) -> list[int]:
    sums: list[int] = []
    counts: dict[int, int] = {}
    window_start, total = 0, 0
    for window_end in range(len(nums)):
        total += nums[window_end]  # note: add right element
        counts[nums[window_end]] = counts.get(nums[window_end], 0) + 1
        if window_end - window_start + 1 == k:
            sums.append(total)  # note: window full
            total -= nums[window_start]
            counts[nums[window_start]] -= 1
            if counts[nums[window_start]] == 0:
                del counts[nums[window_start]]
            window_start += 1
    return sums
