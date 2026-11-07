# Find Median from Data Stream

> Difficulty: **hard** · Patterns: two-heaps, design · Sources: [leetcode](https://leetcode.com/problems/find-median-from-data-stream/), [designgurus](https://www.designgurus.io/course/grokking-the-coding-interview)

## Problem
Design a class that receives integers one at a time and can report the **median** of all numbers
received so far:
- `MedianFinder()` creates an empty finder.
- `addNum(num)` adds an integer to the data structure.
- `findMedian()` returns the median of all numbers added so far, as a float. With an odd count it's
  the middle value. With an even count it's the average of the two middle values.

`findMedian` is only called after at least one `addNum`.

## Examples
`addNum(1)`, `addNum(2)`, `findMedian() → 1.5`, `addNum(3)`, `findMedian() → 2.0`.

## Constraints
- `-10^5 <= num <= 10^5`.
- Up to 5·10^4 calls in total.
- Sorting on every `findMedian` is O(n log n) per call, and inserting into a sorted list is O(n)
  per call. Aim for O(log n) per `addNum` and O(1) per `findMedian`.

## Pattern & how to recognise it
- "**Median** of a **stream**" is the textbook two-heaps signal. You only ever need the boundary
  between the smaller half and the larger half, never the full order.
- A max-heap holds the smaller half and a min-heap the larger half. The median is read from
  their tops.
- Lesson: [Two Heaps](../../learn/two-heaps/01-intro.md).

## Learning material
- **Binary heap:** O(1) peek, O(log n) push and pop. Python's `heapq` is a min-heap, so a max-heap
  stores negated values. Go's `container/heap` takes a `Less` method you write yourself.
- **Two invariants** to maintain after every insert: every value in the small half is ≤ every value
  in the large half, and the sizes differ by at most one.
- [heapq docs](https://docs.python.org/3/library/heapq.html) · [Go container/heap](https://pkg.go.dev/container/heap).

## Hints
<details><summary>Hint 1</summary>

If the numbers were split into a "small half" and a "large half", which elements of each half
would you need to see to know the median?
</details>
<details><summary>Hint 2</summary>

Keep the small half in a max-heap and the large half in a min-heap. After each insert, move at most
one top across so that the small half is the same size as the large half or one bigger.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`lo` = max-heap (negated values), `hi` = min-heap. `addNum(x)`: push into `lo` if it's empty or
`x <= top(lo)`, otherwise into `hi`. Then rebalance: if `len(lo) > len(hi) + 1`, move `lo`'s top
to `hi`. If `len(hi) > len(lo)`, move `hi`'s top to `lo`. `findMedian`: if `lo` is bigger, return
its top. Otherwise return the average of the two tops.

Time O(log n) per `addNum`, O(1) per `findMedian`. Space O(n).
</details>

## Follow-ups
- All numbers are in `[0, 100]`: use a count array of 101 buckets, O(1) insert.
- 99% of numbers are in `[0, 100]`: buckets plus counters for the outliers below and above.
- Support removing a number too (see Sliding Window Median: lazy deletion).
