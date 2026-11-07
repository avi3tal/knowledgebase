"""Worked example (bottom-up): staircase, 1, 2 or 3 steps at a time, filled left to right.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def count_ways(n: int) -> int:
    dp = [0] * (n + 1)  # note: dp[i] = number of ways to reach stair i
    dp[0] = 1  # note: one way to stand at the bottom: do nothing
    for i in range(1, n + 1):
        one = dp[i - 1]  # note: arrive with a 1-step from stair i-1
        two = dp[i - 2] if i >= 2 else 0
        three = dp[i - 3] if i >= 3 else 0
        dp[i] = one + two + three  # note: each answer only needs the previous three — that's the Fibonacci shape
    return dp[n]
