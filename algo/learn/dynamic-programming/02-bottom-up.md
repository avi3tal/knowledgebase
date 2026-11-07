# Bottom-up: tabulation

Turn the recursion inside out. Allocate a table for **all** states, fill in the base cases, then
fill the rest in an **order where everything a cell depends on is already filled**:

```python
dp = <table sized by the state>
<fill base cases>
for state in <order: small → large>:
    dp[state] = combine(dp[smaller_1], dp[smaller_2], ...)
return dp[<answer state>]
```

- **1-D state** (an index or an amount): loop `i` left to right. Each cell looks back a few
  cells or over all earlier cells.
- **2-D state** (a grid cell, two string positions, a range `i..j`): two nested loops. Row by row
  works when a cell depends on the cell above and the cell to the left. For ranges, loop by
  **length** of the range.

Bottom-up uses no recursion at all, so there's no depth limit. Because the loop order is
explicit, it's also where **space optimisation** happens.

## Space optimisation

If row `r` only reads row `r − 1` (or cell `i` only reads `i − 1` and `i − 2`), keep just those:

```
dp table 3×4                        rolling 1-D row
[1  4  5  7]                         prev = [1, 4, 5, 7]
[2  7  6 10]  ← needs only the row    curr built from prev + itself
[6  8  7  8]     above it             O(rows·cols) → O(cols) space
```

Do this **after** the full-table version works. It makes the code harder to follow, and if you
need to **reconstruct the path** (not just its cost), you usually need the full table.

## Top-down or bottom-up?

| | Top-down (memo) | Bottom-up (table) |
|---|---|---|
| Writing it | straight from the recursion | you must find a valid fill order |
| States computed | only the reachable ones | all of them |
| Recursion depth | yes, so watch the limit | none |
| Space optimisation | hard | natural (rolling rows) |
| Overhead | function calls + hashing | tight loops |

In an interview: define the state and transition out loud, write whichever version you find
clearer, then mention the other version and the space optimisation.
