# Palindromic Subsequence

> Pattern #19 · Data structures: array (2-D DP table), string

A family of problems asks for the *best* palindrome hidden inside a string: the longest
palindromic **subsequence**, the fewest deletions or insertions that make the string a
palindrome, how many palindromic substrings it has, the fewest cuts that split it into
palindromes. Brute force tries every subsequence (2ⁿ) or every substring with a check (O(n³)).

**The insight:** a palindrome is defined by its two **ends**. Whatever you decide about
`s[i..j]` depends only on `s[i]`, `s[j]` and the answer for a **shorter interval inside it**
(`s[i+1..j-1]`, `s[i+1..j]` or `s[i..j-1]`). So the state is an interval `[i, j]`, and you solve
intervals **from short to long**. This is called **interval DP**.

For the longest palindromic subsequence (LPS):

```
dp[i][j] = LPS length of s[i..j]

dp[i][i] = 1                                   one character
s[i] == s[j]  →  dp[i][j] = dp[i+1][j-1] + 2   both ends join the inner palindrome
s[i] != s[j]  →  dp[i][j] = max(dp[i+1][j],    one end can't be used,
                                dp[i][j-1])    so drop the left or the right one
```

## Why diagonal by diagonal

`dp[i][j]` reads its neighbours **below** (`i+1`), **left** (`j-1`) and **below-left**. All of
those are shorter intervals. If you fill the table by interval length, one diagonal at a time,
they're always ready:

```
        j→  a  b  b  c  a
   i  a  [  1  .  .  .  ? ]   ← the answer, dp[0][n-1], is the last cell filled
   ↓  b  [     1  .  .  . ]
      b  [        1  .  . ]   length 1: main diagonal
      c  [           1  . ]   length 2: next diagonal up
      a  [              1 ]   ... and so on to the top-right corner
```

The lower-left triangle (`i > j`) is an empty interval and stays 0.

## The template

```python
n = len(s)
dp = [[0] * n for _ in range(n)]
for i in range(n):
    dp[i][i] = <answer for one character>
for length in range(2, n + 1):              # shorter intervals first
    for i in range(n - length + 1):
        j = i + length - 1
        if s[i] == s[j]:
            dp[i][j] = <combine with dp[i+1][j-1]>
        else:
            dp[i][j] = <best of dp[i+1][j], dp[i][j-1]>
return dp[0][n - 1]
```

An equivalent order is `for i in range(n - 1, -1, -1): for j in range(i + 1, n)`: rows bottom
to top, each row left to right. Either order works as long as every shorter interval is done
first.

Step through it below on `"abbca"`. The labels on both axes are the string itself: row `i` is
the left end, column `j` the right end. Watch the `a … a` cell in the top-right corner wrap the
inner `bb`.
