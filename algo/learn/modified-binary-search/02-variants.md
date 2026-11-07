## Variants

### Boundaries: first / last occurrence

With duplicates, an exact match doesn't end the search. To find the **first** occurrence,
record `mid` and keep searching **left** (`hi = mid - 1`); for the **last**, record it and keep
searching **right** (`lo = mid + 1`). Two O(log n) searches give the range of a value. Its count
is `last - first + 1`.

### Rotated sorted arrays

`[4, 5, 6, 7, 0, 1, 2]` isn't sorted, but cut it at any `mid` and **one half is sorted**:

```
lo           mid           hi
 4   5   6    7    0   1   2
 └ sorted: nums[lo] <= nums[mid] ┘
```

- If `nums[lo] <= nums[mid]`, the left half is sorted. Otherwise the right half is.
- A plain range check on the **sorted** half tells you whether the target can be there. If
  it can't, go to the other half.
- The **minimum** (the rotation point) is where the order breaks. Compare `nums[mid]` with
  `nums[hi]`: if `nums[mid] > nums[hi]`, the drop is to the right of `mid`.

### Bitonic (mountain) arrays

An array that strictly increases and then strictly decreases has one peak. Compare
`nums[mid]` with `nums[mid + 1]`: if it's rising, the peak is to the right (`lo = mid + 1`),
otherwise it's at `mid` or to the left (`hi = mid`). That's the `lo < hi` form of the loop,
because `mid` itself may be the answer. To find a key, find the peak first, then run an
ascending search on the left part and a descending search on the right part.

### Binary search on the answer

Sometimes there's no array at all: you search a **range of possible answers** for the smallest
value that passes a monotonic test (`x * x <= n` for an integer square root, "can we ship
everything in D days with capacity c?"). If `ok(c)` implies `ok(c + 1)`, binary search finds
the first `c` where `ok` turns true.

### Two loop shapes

| Shape | Loop | Moves | Use when |
|---|---|---|---|
| closed `[lo, hi]` | `while lo <= hi` | `lo = mid + 1`, `hi = mid - 1` | you can test `mid` and exclude it (find, ceiling, floor, first/last) |
| half-open, converge | `while lo < hi` | `lo = mid + 1`, `hi = mid` | `mid` may be the answer (minimum, peak, first true) |

Mixing them (`while lo < hi` with `hi = mid - 1`, or `lo <= hi` with `hi = mid`) is the most
common source of infinite loops and off-by-ones.

The example below runs the first/last search on an array with five 5s. The first pass keeps
moving `hi` left after each hit, and the second keeps moving `lo` right.
