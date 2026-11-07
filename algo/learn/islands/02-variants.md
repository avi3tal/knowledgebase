## Variant 1: BFS flood fill

Replace the recursion with a queue. Everything else (directions, bounds, the "is it mine?" test)
stays the same:

```python
from collections import deque

seen.add((r, c))
queue = deque([(r, c)])
while queue:
    cr, cc = queue.popleft()
    for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
        if in_bounds(nr, nc) and grid[nr][nc] == "1" and (nr, nc) not in seen:
            seen.add((nr, nc))          # mark when ENQUEUING
            queue.append((nr, nc))
```

- **Mark when you enqueue, not when you pop.** If you mark on pop, a cell with two already-queued
  neighbours gets queued twice. The answer is usually still right, but the queue can blow up.
- **No recursion limit.** Python's default limit is about 1000 frames. A 300 × 300 grid that is
  all land is a 90,000-cell snake for recursive DFS. BFS (or DFS with an explicit stack) is safe.
- The flood spreads in **rings** around the start cell. In counting problems that's a side
  effect. In distance problems it's the whole point (see below).

The trace below counts the islands of a different grid with BFS. Watch the queue: it only ever
holds the current "shoreline" of the flood.

## Variant 2: measure each region while you flood it

The flood visits every cell of the component, so anything you can add up per cell comes for free:
- **Area:** return `1 + sum(flood(neighbour))` from the DFS, or count pops in the BFS. Keep the
  maximum over all regions.
- **Perimeter:** for each land cell, count its four sides that touch water or the grid's edge.
- **Shape:** record the path of moves (`"D"`, `"R"`, `"U"`, back-tracks…) relative to the
  start cell. Equal strings mean equal shapes ("number of distinct islands").

## Variant 3: start from the border (what can escape?)

Some questions are about regions that **do or don't touch the edge**: capture the `O`s that are
fully surrounded by `X`, count closed islands, count land cells that can't walk off the grid.

Don't flood from every cell and check whether you hit the edge. Flip it around: **flood from every
border cell first** and mark everything that touches the edge as "safe". Whatever is left
unmarked is enclosed. The same trick answers "which cells can water flow from to *both* oceans?"
(flood uphill from each ocean's border, then intersect the two marked sets).

## Variant 4: many sources at once (multi-source BFS)

"How many minutes until every fresh orange is rotten?", "distance from every cell to the nearest
0", "walls and gates". Several cells spread **at the same time**. Put **all** the sources in the
queue at time 0, then run level-by-level BFS. Each ring of the queue is one more minute, and each
cell is reached first by its nearest source. Running a separate BFS from every source would cost
O((R·C)²).

## Variant 5: a cycle in the matrix

"Is there a cycle of cells with the same value?" Run DFS, and remember the cell you came from. Reaching an
already-seen cell of the same value **that isn't your parent** closes a loop.
