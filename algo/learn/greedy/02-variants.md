## Common greedy shapes

**1. Interval scheduling (sort by end).** Maximum non-overlapping intervals, minimum arrows to
burst balloons, minimum removals to make intervals disjoint (n − max kept).

**2. Two sorted sequences, match smallest-first.** Assign cookies to children, boats for
people, pair tasks with workers. Sort both, then walk them with two pointers. Giving the
smallest thing that still works keeps the bigger ones for harder cases.

```python
needs.sort(); sizes.sort()
i = 0
for size in sizes:
    if i < len(needs) and size >= needs[i]:
        i += 1            # this cookie satisfies the least greedy child left
return i
```

The animation runs this: each cookie either satisfies the next child or is skipped as too small.

**3. Reach / frontier scans.** Jump game ("can I reach the end?") keeps the **farthest index
reachable** so far; jump game II counts how many times you must extend the frontier. Gas
station: if the running tank goes negative, no start up to here works, so restart after it.

**4. Running best (Kadane-like).** Keep the best answer ending here; drop a prefix as soon as it
hurts. Maximum subarray, best time to buy and sell stock.

**5. Greedy + heap.** When the best choice changes as you go, keep the candidates in a heap:
pick the most profitable project you can afford (IPO), the cheapest two ropes to join, the
largest refuel to undo when you run dry.

**6. Pairwise order (exchange argument as a comparator).** Sometimes no per-item key works, but
for any **two adjacent** items you can tell which order is better. If that rule is consistent,
sorting with it as a comparator gives a globally best order: no adjacent swap can improve it.

## When greedy fails → dynamic programming
- **Coin change** with arbitrary coins: coins [1, 3, 4], amount 6. Greedy takes 4+1+1 (3 coins),
  but 3+3 needs only 2.
- **0/1 knapsack:** the best value-per-weight item can block a better combination. (Fractional
  knapsack, where you may take part of an item, *is* greedy by ratio.)
- **Longest increasing subsequence**, **edit distance**: choices interact, so you need DP.

Rule of thumb: if you can't sketch the exchange argument in two sentences, look for a
counterexample, and switch to DP if you find one.
