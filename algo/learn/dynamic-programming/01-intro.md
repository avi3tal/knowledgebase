# Dynamic Programming

> Fundamental · Data structures: memo dict, 1-D / 2-D table

Dynamic programming (DP) is **recursion that never solves the same subproblem twice**. It
applies when a problem has two properties:

1. **Optimal substructure**: the answer for a problem is built from answers to smaller
   problems of the same kind (paths to (r, c) = paths to the cell above + paths to the cell on
   the left).
2. **Overlapping subproblems**: the plain recursion reaches the **same** smaller problem many
   times. That's what makes it exponential, and why a cache fixes it.

```figure
paths-call-tree
```

With a cache, each distinct state is computed once: **time = number of states × work per state.**

## The five questions (answer them before coding)

1. **State**: what do the parameters of a subproblem mean? Say it in one sentence:
   "`dp[r][c]` = number of paths from the start to (r, c)."
2. **Transition**: how does a state depend on smaller ones? Ask "what was the **last** choice?"
   and combine over the options (`+` to count, `min`/`max` to optimise, `or` for yes/no).
3. **Base cases**: the smallest states, answered directly.
4. **Order**: which states have to be ready before which? (Top-down gets this for free.)
5. **Answer**: which state, or which max over states, is the final result?

## Top-down: memoisation

Write the recursion exactly as the transition says, then add a cache in front of it:

```python
def solve(...):
    memo = {}
    def f(state):
        if <base case>: return <value>
        if state in memo: return memo[state]
        memo[state] = combine(f(smaller_1), f(smaller_2), ...)
        return memo[state]
    return f(<full problem>)
```

(`@functools.cache` on the inner function does the same thing.) Top-down is the fastest way to
get a correct solution from a recursive idea, and it only visits the states that are reachable.
The cost is recursion depth: Python's ~1000-frame limit is easy to hit for large `n`.

Watch below how the second visit to a state returns right away from the memo, and how few frames
are ever on the stack.
