# 0/1 Knapsack

> Pattern #16 · Data structures: array (DP table), hash map (memo)

You have `n` items. Item `i` has a **weight** `weights[i]` and a **profit** `profits[i]`. Your
knapsack holds at most `capacity`. Choose a subset of the items, **each one at most once**, so
that the total weight fits and the total profit is as large as possible.

"0/1" means each item is either **left out (0)** or **taken whole, once (1)**. You can't take
half an item (that's *fractional* knapsack, which greedy solves) and you can't take it twice
(that's *unbounded* knapsack, the next lesson).

The same skeleton solves a whole family: "can some subset sum to S?", "split the array into two
equal halves", "how many subsets sum to S?", "assign + / − to reach a target". All of them are
**a yes/no decision per item under a running budget**.

## Step 1 — brute force: decide each item, recursively

Look at the items one at a time. For item `i` with `c` capacity left, there are only two
choices:

```python
def best(i, c):
    if i == n or c == 0:
        return 0
    skip = best(i + 1, c)                                          # leave item i out
    take = profits[i] + best(i + 1, c - weights[i]) if weights[i] <= c else 0
    return max(skip, take)
```

Every item doubles the number of paths, so this makes up to **2ⁿ** calls: O(2ⁿ) time, O(n)
stack. For 40 items that's a trillion calls.

## Step 2 — top-down: memoise the repeated states

The recursion only ever depends on **two numbers**, `(i, c)`. There are at most `n × (C + 1)`
distinct pairs, but the 2ⁿ paths keep landing on the same ones (skip item 0 and take item 1,
or take item 0 and skip item 1, can leave the same capacity for item 2). Cache each answer the
first time you compute it:

```python
memo = {}
def best(i, c):
    if i == n or c == 0:
        return 0
    if (i, c) in memo:
        return memo[(i, c)]
    ...                                   # same two choices as above
    memo[(i, c)] = max(skip, take)
    return memo[(i, c)]
```

Each state is now computed once with O(1) work: **O(n · C)** time and O(n · C) memory (plus
O(n) stack). This is *pseudo-polynomial*: it's fast when the capacity is a small number, not
when it's 10⁹.

## Step 3 — bottom-up: fill the table

Turn the recursion inside out. `dp[i][c]` = the best profit using **only the first `i` items**
with capacity `c`. Row 0 (no items) and column 0 (no room) are all 0. Every other cell makes the
same skip/take choice, reading **only the row above**:

```text
dp[i][c] = max( dp[i-1][c],                          # skip item i
                dp[i-1][c - w_i] + p_i )             # take it (only if w_i <= c)
```

```figure
knapsack-table
```

Reading "the row above" is what enforces **at most once**: when you take item `i`, the rest of
the knapsack is filled from a row that doesn't contain item `i` yet.

```python
dp = [[0] * (C + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    w, p = weights[i - 1], profits[i - 1]
    for c in range(1, C + 1):
        dp[i][c] = dp[i - 1][c]
        if w <= c:
            dp[i][c] = max(dp[i][c], dp[i - 1][c - w] + p)
return dp[n][C]
```

O(n · C) time, O(n · C) space, no recursion. To recover **which** items were taken, walk back
from `dp[n][C]`: if it differs from `dp[n-1][C]`, item `n` was taken, so subtract its weight
and continue from the row above.

Background on recursion and memoisation: [algo/notes/patterns.md](../../notes/patterns.md)
(section 5, Recursion).

In the trace below, watch the cursor fill the table row by row. Every cell looks straight up
(skip) or up and to the left by `w` (take), never at its own row.
