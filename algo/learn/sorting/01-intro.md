# Sorting

> Fundamental · Data structures: array; techniques: comparison sorts, counting sort, custom keys

Sorting is rarely the whole answer in an interview. It's the **preprocessing step** that makes
the rest easy: after sorting, duplicates sit next to each other, the closest pair is adjacent,
intervals can be swept left to right, and two pointers can move inward. Knowing *which* sort and
*what it costs* is the fundamental part.

## The algorithms you should be able to explain

| Algorithm | Time (avg / worst) | Extra space | Stable | Notes |
|---|---|---|---|---|
| Insertion sort | O(n²) / O(n²) | O(1) | yes | O(n + inversions): very fast on **nearly sorted** or tiny inputs |
| Merge sort | O(n log n) / O(n log n) | O(n) | yes | divide, sort halves, merge; good for linked lists and external sorting |
| Quicksort | O(n log n) / O(n²) | O(log n) | no | partition around a pivot; randomise the pivot to avoid the worst case |
| Heapsort | O(n log n) / O(n log n) | O(1) | no | build a max-heap, pop to the end |
| Counting sort | O(n + k) | O(k) | yes | integer keys in a small range `0..k` |
| Radix sort | O(d · (n + b)) | O(n + b) | yes | d digits in base b, a stable counting sort per digit |
| **Timsort** (Python `sorted`, Java objects) | O(n log n) / O(n log n) | O(n) | yes | merge sort + insertion sort on natural runs |

- Comparison sorts can't beat **Ω(n log n)** in the worst case. Counting/radix sort get around
  this by not comparing: they use the keys as **indices**.
- **Stable** = equal keys keep their input order. It matters when you sort by one key after
  another (sort by name, then stably by age → ties by age stay in name order).

## Insertion sort: the building block

Grow a sorted prefix. Take the next element (`key`), shift every larger element of the prefix one
step right, and drop `key` into the gap.

```python
for i in range(1, len(nums)):
    key, j = nums[i], i - 1
    while j >= 0 and nums[j] > key:   # strict > keeps it stable
        nums[j + 1] = nums[j]          # shift right
        j -= 1
    nums[j + 1] = key
```

It's O(n²) in general but O(n) when the input is already almost in order, which is why Timsort
uses it on short runs. Watch the sorted prefix (everything left of `i`) grow and `key` slide left into its slot.
