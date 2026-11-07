# Arrays & Hashing

> Fundamental · Data structures: array, hash map (dict), hash set

Almost every interview problem starts with an array or a string. Two tools carry most of the
work at this level:

- **The array itself.** Contiguous memory, so `a[i]` is O(1) and a full scan is O(n). Most
  "clever" array tricks are index arithmetic: reading from both ends, writing into a slot
  you've already read, or using the value as an index.
- **A hash map / hash set.** It trades O(n) extra memory for **O(1) average** lookup, insert and
  delete by key. The usual move is replacing an inner "search the rest of the array" loop (O(n²))
  with "have I already seen it?" (O(n)).

```
nums = [100, 4, 200, 1, 3, 2]

seen = {100, 4, 200, 1, 3, 2}     ← build once: O(n)
"is 5 in seen?"  → no, O(1)
"is 3 in seen?"  → yes, O(1)      no scan of the array needed
```

## Operations and their cost

| Operation | Array / list | Hash set / map |
|---|---|---|
| read / write by index | O(1) | — |
| lookup by value / key | O(n) scan | **O(1)** average |
| append at the end | O(1) amortised | insert O(1) average |
| insert / delete in the middle | O(n), elements shift | delete O(1) average |
| sort | O(n log n) | — (no order*) |
| memory | n slots | n entries, larger constant |

\* Python dicts keep insertion order, but they aren't sorted. If you need "smallest key" ordering,
use a heap or sort.

## The "seen" template

```python
seen = set()            # or dict: value → index / count
for i, x in enumerate(nums):
    if <partner of x> in seen:   # whatever x needs: x - 1, the same x, ...
        <found it>
    seen.add(x)                  # add AFTER the check if x must not pair with itself
```

Pick what you store according to what you need back:
- a **set** for "does it exist?",
- a **dict value → index** for "where was it?",
- a **dict value → count** (or `collections.Counter`) for "how many times?".

## Example: a set turns a sort into a scan

The longest run of consecutive integers (in any order) looks like it needs sorting, which is
O(n log n). With a set you only start counting at numbers that **begin** a run (`x - 1` isn't
present), so each number is walked at most once.
