# Subsets

> Pattern #11 · Data structures: queue, array, string

Some problems don't ask for *one* answer: they ask for **every** combination. All subsets of a
set, every string you get by flipping letter cases, every way to abbreviate a word. The output
itself is exponential (a set of n items has 2ⁿ subsets), so there's no fast trick. The skill is
generating each result **exactly once**, with no duplicates and no missed cases.

**The insight:** build the answers **level by level, breadth first, starting from the empty
set**. If you already hold every subset of the first k numbers, the subsets of the first k + 1
are those old subsets **plus a copy of each one with the new number added**. Each number doubles
the collection.

```
nums = [1, 5, 3]

start          [ [] ]
add 1          [ [] ,  [1] ]                                       clone 1 subset
add 5          [ [] ,  [1],  [5],  [1,5] ]                         clone 2 subsets
add 3          [ [] ,  [1],  [5],  [1,5],  [3], [1,3], [5,3], [1,5,3] ]   clone 4
                 └────── old level ──────┘  └──── old level + 3 ────┘
```

## BFS subsets: the template

```python
result = [[]]                         # level 0: the empty subset
for num in nums:
    size = len(result)                # freeze this level's size before appending
    for i in range(size):
        result.append(result[i] + [num])   # clone subset i, add num
return result
```

Two details matter:

- **Freeze the size** before the inner loop. If you loop over `result` while appending to it,
  you'll keep extending the subsets you just created and never stop.
- **Copy**, don't mutate: `result[i] + [num]` builds a new list. Appending `num` to `result[i]`
  itself would change the old subset too.

The same idea works with any per-element choice: "take / skip" for subsets, "lower / upper" for
letter case, "keep / abbreviate" for abbreviations. One position, a few options, every partial
result branches once per option.

## Why it's exponential, and why that's fine

With n numbers there are 2ⁿ subsets, and copying one costs up to O(n), so the time and space
are **O(n · 2ⁿ)**. That's also the size of the output, so no algorithm can do better. The
constraints give it away: these problems have n ≤ 10–15.

In the example below the subsets themselves aren't stored, only their **sums**. It's the same
template with a number instead of a list per subset: `sums[i] + num` is "clone subset i and add
num". Watch `sums` double for each number while `i` sweeps over the frozen level.
