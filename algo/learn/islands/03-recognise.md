## How to recognise it

**Strong signals:**
- The input is a **2-D grid**: a map of land/water, an image of pixels, a board of `X`/`O`, a
  maze of walls.
- The question is about **connected regions**: "islands", "rooms", "regions", "groups of
  adjacent cells", "paint bucket" / flood fill.
- Cells connect to their **4 (or 8) neighbours**, and the answer is a count, a size, a shape or
  a yes/no per region.
- Spreading over time from some cells ("rotting", "fire", "infection", "distance to the nearest
  …") → the same grid traversal with **multi-source BFS**.

**DFS or BFS for the flood?**
- Count / measure / mark regions: either one. DFS is shorter to write.
- Fewest steps, minutes, nearest anything: **BFS**, level by level (see
  [BFS](../bfs/01-intro.md)).
- Very large grids in Python: BFS or an explicit stack, because recursion depth is limited (see
  [DFS](../dfs/01-intro.md) for the explicit-stack version).

**Anti-signals: it looks similar, but it's a different pattern:**
- **Word search** on a letter grid: find a path that spells a word, and each cell may be used
  once *per path*. You must **un-mark** cells when you back out, because another path may use
  them → **Backtracking**. A flood fill never un-marks.
- **Count the paths** from the top-left to the bottom-right moving only right/down, or the
  **minimum path sum** → **Dynamic Programming** on the grid. Moves only go one way, so there are no
  cycles and every cell's answer comes from its top and left neighbours.
- **Weighted** moves (each cell has a cost to enter, find the cheapest route) → Dijkstra with a
  heap (**Heaps** / **Top 'K' Elements** machinery). Plain BFS is only correct when every move costs the same.
- A graph given as an **adjacency list** or **edge list**, not a grid → plain **BFS** or **DFS**
  (same ideas, but the neighbours come from the list instead of direction offsets). Ordering
  constraints like prerequisites → **Topological Sort**.
- A **sorted** matrix where you search for a value (rows and columns increase) → **Modified
  Binary Search** or a staircase walk from a corner. You never flood anything.

**Complexity:**
- Time **O(R·C)**: the scan visits every cell once, and each flood visits each of its cells once
  and checks 4 neighbours.
- Space **O(R·C)** in the worst case: the visited set, plus the recursion depth or queue size
  (an all-land grid). Overwriting the grid in place removes the visited set but not the
  stack/queue.

**Common pitfalls:**
- **Bounds before indexing.** `grid[-1][c]` silently reads the *last* row in Python instead of
  failing.
- **Mark on entry / on enqueue.** Marking too late re-visits cells and can loop forever in DFS.
- **Rows vs columns.** `len(grid)` is rows and `len(grid[0])` is columns. Non-square test grids
  catch swapped loops.
- **Strings are immutable.** With a `list[str]` grid, keep a `seen` set (or convert rows to
  lists) instead of writing into the grid.
- **Flood fill to the same colour.** If the new colour equals the old one, "paint, then recurse
  into cells of the old colour" never terminates. Return early.
- **Recursion limit** on big grids (about 1000 frames by default in Python).
