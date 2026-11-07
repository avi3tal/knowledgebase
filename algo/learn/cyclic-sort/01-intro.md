# Cyclic Sort

> Pattern #6 · Data structures: array (values in a known range)

A whole family of array problems comes with one unusual promise: the values lie in a **fixed
range that matches the array's length**, such as `1..n` or `0..n`. "Find the missing number",
"find all duplicates", "find the smallest missing positive." The general tools work. You can
sort (O(n log n)), or keep a hash set (O(n) extra space). But they ignore the promise.

**The insight:** if values are `1..n` and the array has `n` slots, then every value has a
**home**: value `v` belongs at index `v − 1`. The array can be its own hash table. Walk
through it, and while the current value isn't at home, **swap it home**. Each swap puts at
least one value in its final place, so there are at most `n − 1` swaps in total. That's O(n)
time with O(1) extra space.

```
index:     0  1  2  3  4
start:    [3, 1, 5, 4, 2]
i=0: 3 belongs at 2 → swap   [5, 1, 3, 4, 2]
i=0: 5 belongs at 4 → swap   [2, 1, 3, 4, 5]
i=0: 2 belongs at 1 → swap   [1, 2, 3, 4, 5]
i=0: 1 is home → i=1, 2, 3, 4 are all home → done
```

`i` stays put while it swaps. Whatever lands at `i` is a new value that also needs its home.
`i` moves on only once `nums[i]` is home, or when it can't be placed (see variants).

## The template

```python
i = 0
while i < len(nums):
    j = nums[i] - 1                    # home index of the value at i
    if nums[i] != nums[j]:             # home holds something else → swap
        nums[i], nums[j] = nums[j], nums[i]
    else:
        i += 1                         # at home (or home already has a copy)
```

- Compare **`nums[i] != nums[j]`**, not `i != j`. If the home slot already holds an equal
  value (a duplicate), swapping would loop forever. The value comparison catches that and
  moves on.
- **Why is it O(n) with a nested-looking loop?** Every swap fixes one value permanently, so
  there are at most n swaps. And `i` advances at most n times. That's ≤ 2n iterations in total.
- With values `0..n−1`, the home is `v` itself (`j = nums[i]`). Adjust the mapping, keep the loop.

## After sorting: scan for the mismatch

Cyclic sort is rarely the answer by itself. It's the **setup**. Once every value that *can*
be home *is* home, a slot `k` where `nums[k] != k + 1` tells you something:
- **`k + 1` is missing** from the array.
- **`nums[k]` is an extra copy**, a duplicate that had nowhere to go.

Step through the plain sort below on `[4, 7, 2, 6, 1, 5, 3]`. `home` marks where the current
value belongs. Count the swaps: there are never more than `n − 1`.
