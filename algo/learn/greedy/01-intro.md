# Greedy

> Fundamental · Techniques: sort by the right key, make the locally best choice, never undo it

A **greedy** algorithm builds the answer one decision at a time, always taking the choice that
looks best **right now**, and never reconsiders it. When it works it's usually the simplest and
fastest solution (often "sort + one pass", O(n log n)). When it doesn't, it's confidently wrong.
So the skill is knowing **why** the local choice is safe.

## Why a greedy choice can be safe: the exchange argument

Take any optimal solution that does *not* make your greedy choice. Show you can **swap** its
choice for yours without making it worse. Then some optimal solution agrees with greedy at
every step, so greedy is optimal.

Example: **schedule the most non-overlapping meetings.** Greedy: always pick the meeting that
**ends first** among those that still fit.

```figure
earliest-end-first
```

Swap argument: if an optimal schedule starts with some meeting X instead, replace X with the
earliest-ending meeting E. E ends no later than X, so everything after X still fits. Not worse,
so it's safe.

## Template: sort, then one pass

```python
items.sort(key=<the key that makes the local choice safe>)
state = <initial>
for item in items:
    if <item is compatible with state>:
        <take it>; <update state>
```

The hard part is the **key**: by end time (scheduling), by start (merging), by ratio
(fractional knapsack), by deadline, by size (matching smallest-to-smallest). Try a small
counterexample for each candidate key before you commit.

Step through it: the `chosen` lane only grows, and `last_end` is the one number the greedy needs
to remember.
