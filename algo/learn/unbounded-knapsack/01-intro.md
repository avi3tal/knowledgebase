# Unbounded Knapsack

> Pattern #17 · Data structures: array (DP table), hash map (memo)

Same setup as the [0/1 knapsack](../knapsack-0-1/01-intro.md): items with a size and a value,
a budget, and a best/possible/how-many question. The one difference: **every item can be used
any number of times**. Coins come in unlimited supply, a rod can be cut into many pieces of the
same length, a ribbon into many equal pieces.

The classic example is **rod cutting**. A rod of length `n` can be cut into pieces. A piece of
length `lengths[i]` sells for `prices[i]`. What's the most you can earn?

```text
lengths = [1, 2, 3], prices = [2, 6, 7], n = 5
  5 = 2 + 2 + 1  → 6 + 6 + 2 = 14   ← best (the length-2 piece is used twice)
  5 = 2 + 3      → 6 + 7     = 13
  5 = 1×5        → 2 × 5     = 10
```

## Step 1 — brute force

At each step, look at piece size `i` with `r` length of rod left. Either **stop using this size**
and move on to the next one, or **cut one piece** of it and stay on the same size, because you
might cut another:

```python
def best(i, r):
    if i == k or r == 0:
        return 0
    skip = best(i + 1, r)                                         # done with size i
    take = prices[i] + best(i, r - lengths[i]) if lengths[i] <= r else 0   # i again!
    return max(skip, take)
```

The only change from 0/1 is `best(i, ...)` instead of `best(i + 1, ...)` in the take branch.
The call tree is still exponential in the rod length, because the same `(i, r)` pairs are reached by many different cut sequences.

## Step 2 — top-down: memoise `(i, r)`

Again the answer only depends on `(i, r)`, so there are `k × (n + 1)` distinct states. Cache them
in a dict or a 2-D array: **O(k · n)** time and space.

## Step 3 — bottom-up: the take branch reads its own row

`dp[i][r]` = the best price for a rod of length `r` using the first `i` sizes:

```text
dp[i][r] = max( dp[i-1][r],                        # skip: row above
                dp[i][r - size_i] + price_i )      # take: SAME row, further left
```

```figure
rod-cutting-table
```

`dp[2][3] = 8` already contains one length-2 piece (2 + 1). Adding another to it gives 2 + 2 + 1
for 14. Reading the **same row** is what lets a size repeat. In 0/1 knapsack you'd read the row
above, which doesn't contain size `i` yet.

```python
dp = [[0] * (n + 1) for _ in range(k + 1)]
for i in range(1, k + 1):
    size, price = lengths[i - 1], prices[i - 1]
    for r in range(1, n + 1):
        dp[i][r] = dp[i - 1][r]
        if size <= r:
            dp[i][r] = max(dp[i][r], dp[i][r - size] + price)
return dp[k][n]
```

O(k · n) time and space. Background on recursion and memoisation:
[algo/notes/patterns.md](../../notes/patterns.md) (section 5, Recursion).

In the trace, watch the cursor on row `len 2`: the take value comes from the **same row**, a
couple of cells to the left.
