"""Worked example (top-down): staircase, 1, 2 or 3 steps at a time, with memoisation.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def count_ways_memo(n: int) -> int:
    memo: dict[int, int] = {}  # note: memo[k] = number of ways to climb k stairs, filled the first time k is solved

    def ways(k: int) -> int:
        if k < 0:
            return 0  # note: overshot the top — not a valid way
        if k == 0:
            return 1  # note: exactly at the top — one way (take no more steps)
        if k in memo:
            return memo[k]  # note: cache hit — this subtree is not explored again
        memo[k] = ways(k - 1) + ways(k - 2) + ways(k - 3)  # note: last step was 1, 2 or 3: add three answers
        return memo[k]

    return ways(n)
