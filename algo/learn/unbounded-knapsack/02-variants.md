## Step 4 — space optimisation: one row, left to right

Row `i` reads row `i − 1` (skip) and **itself** (take). Collapse it into one array and walk the
budget **left to right**:

```python
dp = [0] * (n + 1)
for size, price in zip(lengths, prices):
    for r in range(size, n + 1):            # LEFT TO RIGHT
        dp[r] = max(dp[r], dp[r - size] + price)
```

When you reach `dp[r]`, the cell `dp[r − size]` to its left has **already been updated for this
size**, so it may already contain a piece of this size. Adding one more is exactly "use it
again". Compare the [0/1 version](../knapsack-0-1/02-space-and-variants.md), which walks right
to left precisely to prevent this.

```
size 2, price 6, before: dp = [0, 2, 4, 6, 8, 10]
r = 2: max(4,  dp[0] + 6) = 6
r = 3: max(6,  dp[1] + 6) = 8
r = 4: max(8,  dp[2] + 6) = 12     dp[2] = 6 already holds one size-2 piece
r = 5: max(10, dp[3] + 6) = 14     after: [0, 2, 6, 8, 12, 14]
```

O(k · n) time, **O(n)** space.

## The variants

Only the cell meaning and the combine step change. The loop shape stays the same:

| Question | Example | `dp[t]` | Base | Combine (`t` from `x` up to T) |
|---|---|---|---|---|
| Max value | rod cutting | best price | `dp[*] = 0` | `max(dp[t], dp[t-x] + v)` |
| Min items | coin change (fewest coins) | fewest items | `dp[0] = 0`, rest ∞ | `min(dp[t], dp[t-x] + 1)` |
| Max items, exact fill | ribbon cut | most pieces | `dp[0] = 0`, rest −∞ | `max(dp[t], dp[t-x] + 1)` |
| Count combinations | coin change II | ways | `dp[0] = 1` | `dp[t] + dp[t-x]` |

Two details decide whether you get the right answer:

- **Exact fill needs an "impossible" marker.** In rod cutting a leftover bit of rod is fine (it
  just earns nothing), so 0 is a safe default. When the budget must be used **exactly** (coins,
  ribbon), start the unreachable cells at ∞ or −∞ so they never win a `min`/`max`, and map them
  to −1 at the end.
- **Combinations vs permutations.** With the **items in the outer loop** (as above), each
  multiset is counted once: `1 + 2` and `2 + 1` are the same way. If you put the **budget in the
  outer loop** and the items inside, `dp[t] = Σ dp[t − x]` counts every *order* separately. That
  ordered version is really a [Fibonacci-style](../fibonacci-numbers/01-intro.md) recurrence
  (climbing stairs with steps from a set).

The second trace solves the same rod with one row. Watch `r` sweep left to right for every size.
