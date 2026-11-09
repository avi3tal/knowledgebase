## Step 4 — space optimisation: one row, right to left

Row `i` only reads row `i - 1`, so two rows are enough. You can go further and keep **one**
1-D array `dp[c]`, updating it in place for each item. The catch is the direction:

```python
dp = [0] * (C + 1)
for w, p in zip(weights, profits):
    for c in range(C, w - 1, -1):          # RIGHT TO LEFT
        dp[c] = max(dp[c], dp[c - w] + p)
```

When you update `dp[c]` you read `dp[c - w]`, which is to the **left**. Walking right to left
means the left part hasn't been touched yet for this item, so it still holds the **previous
item's row**. That is exactly `dp[i-1][c-w]`, and the item can't be used twice.

```figure
one-row-right-to-left
```

If you walked **left to right** instead, `dp[c - w]` might already include the current item,
and you'd silently solve the *unbounded* knapsack. That one loop direction is the whole
difference between the two patterns.

Space drops to **O(C)**; time stays O(n · C). You lose the ability to backtrack the chosen
items, because the earlier rows are gone.

## The subset-sum family

Most interview problems in this pattern have **no profits**. The item's value *is* its weight,
and you ask a question about the sums you can make. Only the cell type and the combine
operation change:

| Question | `dp[s]` holds | Base | Combine (`s` from S down to `x`) |
|---|---|---|---|
| Max profit within capacity | best profit | `dp[*] = 0` | `max(dp[s], dp[s-x] + p)` |
| Can some subset sum to S? | bool | `dp[0] = True` | `dp[s] or dp[s-x]` |
| How many subsets sum to S? | count | `dp[0] = 1` | `dp[s] + dp[s-x]` |

Then a few classics are just a **reduction** to one of those rows:

- **Equal subset partition.** Two halves with equal sums means one subset sums to `total / 2`.
  If the total is odd, the answer is no straight away. Otherwise run the bool row up to
  `total / 2`.
- **Minimum subset sum difference.** Fill the bool row up to `total / 2`. The largest reachable
  `s` is the best "smaller half", and the answer is `total - 2·s`.
- **Target sum (+/− signs).** Let `P` be the numbers with `+` and `N` the ones with `−`. Then
  `P − N = target` and `P + N = total`, so `P = (total + target) / 2`. Count subsets that sum to
  that (no solution if it's negative or odd).

Watch out for **zeros** in counting problems. A zero can be taken or left out without changing
the sum, so it doubles the count. Start the inner loop at `s = S` and go down to `x` (to 0 for
`x = 0`) and the table handles it for you.

In the trace below the same three items fill a single row. Watch `c` walk from right to left
for each item.
