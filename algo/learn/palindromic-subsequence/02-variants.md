## Variants: same table, different cell

Every problem in this family keeps the interval `[i, j]` as the state. What changes is what a
cell stores and how the two ends combine.

**1. Subsequence vs substring. Know which one you're asked for.**
- *Subsequence:* characters may be skipped. When the ends differ, you **drop one end** and keep
  the best of the two shorter intervals (the LPS recurrence above).
- *Substring:* characters must be contiguous. A cell is a **boolean**: `s[i..j]` is a
  palindrome iff `s[i] == s[j]` and the inside `s[i+1..j-1]` is one (or is length ≤ 1). When the
  ends differ, it's simply `False`, with no "drop an end" option.
- Many substring questions (longest palindromic substring, counting palindromic substrings)
  also have an O(1)-space solution: **expand around each centre** (2n − 1 centres, odd and
  even). It's the same idea, growing intervals outward from the inside.

**2. Minimum deletions (or other edits) to make a palindrome.**
Everything you *keep* must form a palindromic subsequence. To delete as little as possible,
keep as much as possible:

```
min deletions = n − LPS(s)
```

A useful habit: before writing a new table, ask whether the question is the LPS in disguise.
Other "fix the string" questions in this family reduce the same way. Think about what the
characters you *don't* touch must look like.

**3. Counting palindromes.**
Fill the boolean substring table and count the `True` cells, or count while expanding around
centres. Note that counting palindromic **subsequences** is a harder problem with its own
inclusion–exclusion recurrence. Read the word carefully.

**4. Partitioning into palindromes (minimum cuts).**
This is two DPs layered together:
- a boolean table `pal[i][j]` saying which substrings are palindromes (interval DP), and
- a 1-D DP over prefixes: `cuts[j]` = the fewest cuts for `s[0..j]`, trying every last piece
  `s[i..j]` that is a palindrome.

That's O(n²) overall. Without the precomputed table, each palindrome check costs O(n) and you
drift to O(n³).

**Space.** `dp[i][j]` only reads rows `i` and `i+1`. If you iterate `i` from `n−1` down to 0
you can keep just two rows (or one, with care), which takes the space from O(n²) to O(n).
