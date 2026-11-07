"""Worked example (2-D DP over two strings): length of the longest common subsequence.

Reference code for the lesson animation; `# note:` comments become the narration.
dp[i][j] = LCS length of the prefixes a[:i] and b[:j]; row 0 and column 0 are empty prefixes.
"""


def longest_common_subsequence(a: str, b: str) -> int:
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]  # note: row/column 0 = empty prefix, LCS 0
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1  # note: last characters match — extend the diagonal answer by 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # note: mismatch — drop a's or b's last char
    return dp[len(a)][len(b)]  # note: bottom-right cell = LCS of the full strings
