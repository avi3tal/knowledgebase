## Variant 1: intersect two sorted lists

Two schedules, each sorted and non-overlapping (say, two people's free time). Find the slots
that are in **both**. Use one pointer per list, like the merge step of merge sort:

```python
i = j = 0
while i < len(a) and j < len(b):
    lo = max(a[i][0], b[j][0])                # the later start
    hi = min(a[i][1], b[j][1])                # the earlier end
    if lo <= hi:
        out.append([lo, hi])                  # non-empty overlap
    if a[i][1] < b[j][1]:                     # drop whichever ends first:
        i += 1                                # it can't overlap anything later
    else:
        j += 1
```

The intersection of two intervals is always `[max(starts), min(ends)]`. It's empty when that
start is past that end. Advance the one that **ends first**, because the other one may still
overlap the next interval.

## Variant 2: does anything overlap? (conflict check)

"Can one person attend all these meetings?" Sort by start, then check each **adjacent** pair:
a conflict exists if and only if some `intervals[k].start < intervals[k-1].end`. Again,
sorting means neighbours are the only candidates. That's O(n log n), with no merging needed.

## Variant 3: how many overlap at once? (a heap of end times)

"How many rooms do these meetings need?" or "What's the peak CPU load?" The answer is the
**maximum number of intervals alive at the same moment**. Merging loses that information,
because merging `[1,4]` and `[2,5]` hides that two things were running.

Sort by start and keep a **min-heap of the end times** of everything still running:

```python
intervals.sort()
heap = []                                     # end times of running intervals
for start, end in intervals:
    while heap and heap[0] <= start:          # earliest finisher is already done
        heapq.heappop(heap)
    heapq.heappush(heap, end)
    best = max(best, len(heap))               # everything in the heap overlaps `start`
```

- The heap's top is the **earliest-ending** running interval, the first one that can retire.
  A sorted list would also work, but each insert would cost O(n). The heap makes it
  O(log n), so the whole sweep is O(n log n).
- Instead of `len(heap)` you can track any total over the running set, such as a summed load.
  Push `(end, load)` and add or subtract the load as jobs enter and leave.

**Alternative: a sweep line.** Turn each interval into two events, `(start, +1)` and
`(end, -1)`. Sort the events, put `-1` before `+1` on ties when touching doesn't count as
overlap, and track the running sum. Same O(n log n), and no heap.

Below, five jobs `[start, end, load]` run on one CPU. Each time a job starts, the heap first
drops the jobs that have already ended. What's left in the heap is exactly the set running
alongside the new job, and their load total is the current CPU load.
