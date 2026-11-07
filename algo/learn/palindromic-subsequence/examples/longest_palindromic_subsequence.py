"""Worked example (interval DP): length of the longest palindromic subsequence.

Reference code for the lesson animation; `# note:` comments become the narration.
dp[i][j] = length of the longest palindromic subsequence of s[i..j] (inclusive).
"""


def longest_palindromic_subsequence(s: str) -> int:
    n = len(s)
    if n == 0:
        return 0
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = 1  # note: base case — a single character is a palindrome of length 1
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1  # note: next interval s[i..j] on this diagonal (all shorter ones are done)
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2  # note: ends match — wrap the inner answer s[i+1..j-1] with both
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])  # note: ends differ — drop the left or the right end
    return dp[0][n - 1]  # note: the whole string is the top-right cell
