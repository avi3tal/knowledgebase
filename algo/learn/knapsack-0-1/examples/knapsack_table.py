"""Worked example (bottom-up table): classic 0/1 knapsack, maximum profit within a capacity.

Reference code for the lesson animation; `# note:` comments become the narration.
dp[i][c] = best profit using only the first i items with capacity c.
"""


def knapsack(weights: list[int], profits: list[int], capacity: int) -> int:
    items = list(zip(weights, profits, strict=True))  # (weight, profit) per row
    caps = range(capacity + 1)  # one column per capacity 0..capacity
    dp = [[0] * len(caps) for _ in range(len(items) + 1)]  # note: row 0 = no items, so every cell is 0
    for i, (w, p) in enumerate(items, start=1):
        for c in caps[1:]:
            skip = dp[i - 1][c]  # note: skip item i: the row above, same capacity
            take = dp[i - 1][c - w] + p if w <= c else 0  # note: take item i: p + the row above with c - w left
            dp[i][c] = max(skip, take)  # note: better of the two; only row i-1 is read, so item i is used once
    return dp[-1][capacity]  # note: bottom-right cell = all items, full capacity
