# Fibonacci Numbers

> Pattern #18 · Data structures: array (1-D DP), hash map (memo)

Fibonacci is the smallest example of dynamic programming: `F(n) = F(n−1) + F(n−2)`. The pattern
covers every problem where **the answer for `n` is built from a fixed handful of earlier
answers**: the last 2, 3 or `k` values, and nothing else. There is no capacity or second index,
just one line of values filled from left to right.

The PDF's example is the **staircase**: you can climb 1, 2 or 3 stairs at a time. How many
different ways are there to climb `n` stairs?

Look at the **last move**. To stand on stair `n` you arrived from `n−1`, `n−2` or `n−3`, and those
are three disjoint groups of ways:

```text
ways(n) = ways(n−1) + ways(n−2) + ways(n−3)        ways(0) = 1, ways(<0) = 0
```

```figure
staircase-ways
```

## Step 1 — brute force: the recursion as written

```python
def ways(n):
    if n < 0:
        return 0
    if n == 0:
        return 1
    return ways(n - 1) + ways(n - 2) + ways(n - 3)
```

Each call makes three more, so the call tree has at most **3ⁿ** nodes (about 1.84ⁿ in fact; for plain Fibonacci, at most 2ⁿ,
more exactly φⁿ ≈ 1.618ⁿ). It's exponential because the **same `n` is solved over and over**:
`ways(5)` calls `ways(4)` and `ways(3)`, and `ways(4)` calls `ways(3)` again, and so on all the
way down.

## Step 2 — top-down: memoise

There are only `n + 1` different arguments. Store each answer the first time it's computed and
return it straight away after that:

```python
memo = {}
def ways(k):
    if k < 0:
        return 0
    if k == 0:
        return 1
    if k in memo:
        return memo[k]
    memo[k] = ways(k - 1) + ways(k - 2) + ways(k - 3)
    return memo[k]
```

Each `k` is now solved once with O(1) work: **O(n)** time, O(n) memo plus O(n) recursion depth.
The depth is the weak spot: `n = 10⁵` will overflow Python's default recursion limit.

Background on recursion and memoisation: [algo/notes/patterns.md](../../notes/patterns.md)
(section 5, Recursion).

In the trace below, watch the call stack dive down to `ways(0)` first, then the memo fill from
the bottom up. Once `memo` has an entry, later calls for it return at once ("cache hit") instead
of growing a whole subtree.
