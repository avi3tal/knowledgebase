# Merge Intervals

> Pattern #5 · Data structures: array of [start, end] pairs, heap

Many problems hand you a list of **ranges**: meetings, bookings, CPU jobs, genome segments.
They ask what happens where those ranges **overlap**. Merge the overlapping ones, insert a new
one, intersect two schedules, count how many run at once. Comparing every pair is O(n²), and
it misses chains like `[1,3] [2,5] [4,8]`, where the first and the last only touch through the
middle one.

**The insight:** **sort by start**. Once the intervals are in start order, an interval can only
overlap the ones **just before it**. You never need to look back further than the last
interval you kept. One linear sweep then answers the question.

Two intervals `a` and `b` with `a.start <= b.start` overlap exactly when **`b.start <= a.end`**.
Once you've sorted, that one comparison is the whole overlap test.

```figure
merge-sweep
```

The six ways two intervals can sit relative to each other reduce to **two cases** once
`a.start <= b.start`:
- `b.start > a.end`: **disjoint**. `a` is finished, so emit it and start a new one with `b`.
- `b.start <= a.end`: **overlap**, which covers partial overlap, `b` inside `a`, and touching
  ends. The merged interval is `[a.start, max(a.end, b.end)]`. Use `max`, because `b` may end
  *before* `a` does when `a` contains it.

## The template: merge a list

```python
intervals.sort(key=lambda iv: iv[0])         # O(n log n), the dominant cost
merged = []
for start, end in intervals:
    if merged and start <= merged[-1][1]:    # overlaps the last kept interval
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])          # disjoint: begin a new one
return merged
```

- Compare only with `merged[-1]`. Sorting guarantees nothing earlier can overlap.
- `<=` treats touching intervals (`[1,4]` and `[4,5]`) as overlapping. Some problems (meeting
  rooms) say a meeting ending at 4 frees the room for one starting at 4, so read the
  statement and pick `<` or `<=` on purpose.

## Already sorted? Then it's one pass with three phases

If the input is **already sorted and non-overlapping** (a calendar, a set of free slots),
you don't even need the sort. Inserting a new interval is a single O(n) sweep in three
phases:

1. Copy every interval that **ends before** the new one starts.
2. **Absorb** every interval that starts before the new one ends: stretch the new interval
   to `[min(starts), max(ends)]`.
3. Copy everything that's left.

Step through it below. The `input` lane is the sorted calendar, `merged` is the output being
built, and `start`/`end` is the new interval `[4, 8]` as it swallows `[3,5]`, `[6,7]` and
`[8,10]`.
