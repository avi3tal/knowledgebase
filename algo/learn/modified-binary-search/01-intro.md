# Modified Binary Search

> Pattern #12 · Data structures: array

Whenever the input is **sorted**, or is sorted in pieces (rotated, increasing then decreasing),
a linear scan wastes the order. Binary search looks at the middle element and **throws away
half of the remaining range** at every step: O(log n) instead of O(n). A million elements take
20 steps.

**The insight:** the classic "find x" search is only the start. Most interview questions ask for
something next to x: the first element **≥ key** (ceiling), the last element ≤ key (floor), the
**first and last** position of a repeated value, the peak of a mountain, the smallest value that
satisfies a condition. They all use the same loop. What changes is **what you do when
`nums[mid]` matches or almost matches**, and **what you return when the range is empty**.

```
key = 12
index:   0   1   2   3   4   5   6
nums:    1   3   8  10  15  20  25
step 1:  lo         mid          hi     10 < 12 → lo = mid + 1 = 4
step 2:                  lo mid  hi     20 > 12 → hi = mid - 1 = 4
step 3:                 lo/mid/hi       15 > 12 → hi = mid - 1 = 3
end:                 hi  lo             lo > hi: ceiling = nums[lo] = 15
```

## The template: one loop, many endings

```python
lo, hi = 0, len(nums) - 1
while lo <= hi:                       # live range is [lo, hi]
    mid = lo + (hi - lo) // 2         # no overflow in fixed-width languages
    if nums[mid] < key:
        lo = mid + 1                  # mid and everything left of it are too small
    elif nums[mid] > key:
        hi = mid - 1                  # mid and everything right of it are too big
    else:
        return mid                    # exact match (or: record it and keep going)
# loop ended: lo == hi + 1
# lo = first index with nums[i] > key  → the ceiling when the key is absent
# hi = last index with nums[i] < key   → the floor
```

The **invariant** is what makes it correct: everything left of `lo` is known to be `< key`,
and everything right of `hi` is known to be `> key`. Each step moves one boundary past `mid`,
so the live range `[lo, hi]` shrinks by at least half and the loop always ends. When it ends,
`lo` and `hi` have crossed, and they sit exactly on the boundary you were looking for.

## Ceiling and floor

- **Ceiling** (smallest element ≥ key): return `mid` on a match, otherwise `lo` after the
  loop. If `key` is bigger than the last element there's no ceiling, so check that up front.
- **Floor** (largest element ≤ key): the mirror image: return `hi` after the loop. If `key` is
  smaller than the first element there's no floor.

In the example below, the highlighted window is the live range `[lo, hi]`. Watch it halve, then
see `lo` land on the ceiling when the range becomes empty.
