# Longest Common Substring

> Pattern #20 · Data structures: array (2-D DP table), string

This pattern covers problems that line up **two sequences** and ask for the best way to match
them: the longest common substring or subsequence, the edit distance between two words, the
shortest common supersequence, whether one string interleaves two others. The same table also
works on **one sequence against itself** (longest increasing subsequence, maximum-sum increasing
subsequence). Brute force tries every subsequence of one string against the other, which is
exponential.

**The insight:** describe a sub-problem by **how much of each sequence you've used**, a pair
of prefixes `a[:i]` and `b[:j]`. The answer for `(i, j)` depends only on the **last
characters** `a[i-1]`, `b[j-1]` and on smaller prefix pairs. That gives an
`(len(a)+1) × (len(b)+1)` table where every cell is O(1) work.

For the longest common **subsequence** (LCS):

```
dp[i][j] = LCS length of a[:i] and b[:j]

dp[0][*] = dp[*][0] = 0                        an empty prefix has nothing in common
a[i-1] == b[j-1]  →  dp[i][j] = dp[i-1][j-1] + 1      use the match
a[i-1] != b[j-1]  →  dp[i][j] = max(dp[i-1][j],        drop a's last char
                                    dp[i][j-1])        or drop b's last char
```

## Reading the table

Each cell looks **up**, **left** and **up-left**. Filling row by row, left to right, guarantees
all three are ready:

```
            ∅  b  d  c  b
        ∅ [ 0  0  0  0  0 ]
        a [ 0  0  0  0  0 ]
        b [ 0  1  1  1  1 ]     a match moves you diagonally (↘ +1)
        c [ 0  1  1  2  2 ]     a mismatch copies the better of ↓ and →
        b [ 0  1  1  2  3 ]
        d [ 0  1  2  2  3 ]  ← answer: bottom-right
```

The extra row and column 0 stand for the **empty prefix**. They remove every `i == 0` special
case from the loop.

## The template

```python
dp = [[<base>] * (len(b) + 1) for _ in range(len(a) + 1)]
<fill row 0 and column 0 if the base isn't constant>
for i in range(1, len(a) + 1):
    for j in range(1, len(b) + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = <use the match: dp[i-1][j-1] ...>
        else:
            dp[i][j] = <best of skipping a char: dp[i-1][j], dp[i][j-1] (, dp[i-1][j-1])>
return dp[len(a)][len(b)]       # or the best cell seen, for substring-type questions
```

Step through it below with `a = "abcbd"` on the rows and `b = "bdcb"` on the columns (the `∅`
row and column are the empty prefixes). Watch how a match always reads the cell **diagonally
up-left**, while a mismatch takes the larger of the cell above and the cell to the left.
