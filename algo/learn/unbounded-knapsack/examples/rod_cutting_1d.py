"""Worked example (space optimised): rod cutting with one 1-D row, rod length left-to-right.

Reference code for the lesson animation; `# note:` comments become the narration.
dp[r] = best price for a rod of length r with the piece sizes seen so far.
"""


def rod_cutting_1d(lengths: list[int], prices: list[int], n: int) -> int:
    dp = [0] * (n + 1)  # note: one row replaces the whole table
    for i in range(len(lengths)):
        size, price = lengths[i], prices[i]
        for r in range(size, n + 1):  # note: LEFT to right, so dp[r - size] may already use this size
            dp[r] = max(dp[r], dp[r - size] + price)  # note: keep the rod whole, or cut one more piece of this size
    return dp[n]
