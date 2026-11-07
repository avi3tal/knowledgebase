"""Worked example (bottom-up table): rod cutting, unbounded knapsack with a 2-D table.

Reference code for the lesson animation; `# note:` comments become the narration.
dp[i][r] = best price for a rod of length r using only the first i piece sizes.
"""


def rod_cutting(lengths: list[int], prices: list[int], n: int) -> int:
    pieces = list(zip(lengths, prices, strict=True))  # (length, price) per row
    rod = range(n + 1)  # one column per rod length 0..n
    dp = [[0] * len(rod) for _ in range(len(pieces) + 1)]  # note: row 0 = no piece sizes, so every cell is 0
    for i, (size, price) in enumerate(pieces, start=1):
        for r in rod[1:]:
            skip = dp[i - 1][r]  # note: skip: never cut this size, so use the row above
            take = dp[i][r - size] + price if size <= r else 0  # note: take one piece: the SAME row, so it can repeat
            dp[i][r] = max(skip, take)  # note: keep the better of the two
    return dp[-1][n]  # note: all sizes allowed, full rod
