# Islands (Matrix Traversal)

> Pattern #2 · Data structures: matrix (2-D grid), visited set, queue or recursion stack

A lot of grid questions are graph questions in disguise. Count the islands in a map of land and
water. Repaint the region a pixel belongs to. Find the largest lake. Decide which cells can drain
to the ocean. Nothing in the input says "graph", but the structure is there:

- every **cell** is a vertex;
- every cell has an **edge** to its up / down / left / right neighbours (sometimes diagonals too);
- a **region** (island, lake, colour patch) is a **connected component** of the cells that share
  a property.

**The insight:** scan the grid once. Each time you step on a cell of the right kind that you
haven't seen yet, you've found a **new component**. Immediately **flood** it: visit every cell
reachable from it and mark them all as seen. The scan then skips the rest of that component, so
each component is counted exactly once, and each cell is touched a constant number of times.

```
grid                 scan hits (0,0): new island #1, flood it
1 1 0 0 0            ■ ■ . . .
1 1 0 1 0     →      ■ ■ . 1 .      scan continues; (1,3) is land and unseen → island #2
0 0 1 0 0            . . 1 . .      then (2,2) → #3, then (3,3) → #4 (flood takes (3,4) too)
0 0 0 1 1            . . . 1 1
```

The flood itself is just a graph traversal: **DFS** (recursion or a stack) or **BFS** (a queue).
Both visit exactly the same cells. They differ only in the *order*, which doesn't matter when
you only need "which cells belong together". Pick whichever you write faster, and switch to BFS
when the order matters (distances, see [BFS](../bfs/01-intro.md)) or the grid is so large that
recursion depth becomes a problem.

## The template

```python
def count_regions(grid):
    rows, cols = len(grid), len(grid[0])
    seen = set()

    def flood(r, c):
        seen.add((r, c))                        # mark first, then explore
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols \
                    and grid[nr][nc] == "1" and (nr, nc) not in seen:
                flood(nr, nc)

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1                      # a brand-new component
                flood(r, c)
    return count
```

Four pieces to get right every time:
1. **Directions:** a tuple of `(dr, dc)` offsets. Four for "horizontally or vertically", eight
   if diagonals connect.
2. **Bounds check first:** `0 <= nr < rows and 0 <= nc < cols` before you index the grid.
3. **The "is it mine?" test:** same value, same colour, still land.
4. **Mark on entry:** add a cell to `seen` *before* exploring its neighbours, or two
   neighbours can keep sending the search back to each other.

Instead of a `seen` set you can **overwrite the grid** (turn `"1"` into `"0"`, or paint the new
colour). That's O(1) extra space apart from the recursion, but it destroys the input. Ask
whether that's allowed.

Step through it below. The grid is drawn with the visited cells highlighted. Watch the call stack
grow as `sink` dives from cell to cell, then unwind back to the scanning loop, which carries on
past the cells that are already marked.
