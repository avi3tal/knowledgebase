"""Worked example (space optimised): 0/1 knapsack with one 1-D row, capacity loop right-to-left.

Reference code for the lesson animation; `# note:` comments become the narration.
dp[c] = best profit with capacity c using the items seen so far.
"""


def knapsack_1d(weights: list[int], profits: list[int], capacity: int) -> int:
    dp = [0] * (capacity + 1)  # note: one row replaces the whole table
    for i in range(len(weights)):
        w, p = weights[i], profits[i]
        for c in range(capacity, w - 1, -1):  # note: RIGHT to left, so dp[c - w] is still the previous item's row
            dp[c] = max(dp[c], dp[c - w] + p)  # note: skip (old dp[c]) vs take (old dp[c - w] + p): item i used once
    return dp[capacity]
