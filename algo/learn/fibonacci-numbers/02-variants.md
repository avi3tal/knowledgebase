## Step 3 — bottom-up: fill the array left to right

The memo is filled from small `k` to large `k` anyway, so skip the recursion and do it with a
loop:

```python
dp = [0] * (n + 1)
dp[0] = 1
for i in range(1, n + 1):
    dp[i] = dp[i-1] + (dp[i-2] if i >= 2 else 0) + (dp[i-3] if i >= 3 else 0)
return dp[n]
```

O(n) time, O(n) space, no recursion depth.

## Step 4 — space optimisation: keep only the window you read

`dp[i]` only reads the last three cells, so three variables are enough:

```python
a, b, c = 0, 0, 1          # ways(-2), ways(-1), ways(0)
for _ in range(n):
    a, b, c = b, c, a + b + c
return c
```

**O(1)** space. For plain Fibonacci it's two variables: `a, b = b, a + b`.

## The same shape with different clothes

Every problem below is "write the recurrence for `i` from the last few answers, set the base
cases, then fill left to right":

| Problem | Recurrence | Base |
|---|---|---|
| Fibonacci | `F(i) = F(i−1) + F(i−2)` | `F(0)=0, F(1)=1` |
| Staircase, steps from a set S | `f(i) = Σ f(i−s)` for s in S | `f(0)=1` |
| Number factors (ordered sums of 1, 3, 4) | `f(i) = f(i−1) + f(i−3) + f(i−4)` | `f(0)=1` |
| Min cost climbing stairs | `c(i) = min(c(i−1) + cost[i−1], c(i−2) + cost[i−2])` | `c(0)=c(1)=0` |
| House thief (no two adjacent) | `r(i) = max(r(i−1), r(i−2) + v[i])` | `r(−1)=r(−2)=0` |
| Min jumps to reach the end | `j(i) = 1 + min(j(k))` over every k that can jump to i | `j(0)=0` |

Things to notice:

- The combine step can be `+` (count ways), `min` (cheapest) or `max` (best value). The
  shape stays the same.
- **House thief** is the "take it or skip it" choice from knapsack, but with no capacity. Taking
  house `i` only forbids house `i−1`, so the state is still just `i`.
- **Circular** versions (first and last are neighbours) are solved by running the linear
  version twice: once without the first element and once without the last.
- **Min jumps** reads a *variable* number of earlier cells, so it's O(n²) as DP. It's still in this
  family, but a greedy BFS-by-levels does it in O(n).
- Counting **ordered** sums ("1 + 3 and 3 + 1 are different") is this pattern. Counting
  **unordered** combinations is [unbounded knapsack](../unbounded-knapsack/02-variants.md) with
  the items in the outer loop.

In the trace below, the same staircase is filled left to right. Each cell is the sum of the
three cells before it.
