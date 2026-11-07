## Variants

**Elements that aren't 0..n−1.** Use a dict for `parent` and create entries lazily:
`parent.setdefault(x, x)`. This works for strings (emails, variable names), letters, coordinates.

**Choose the representative on purpose.** The root can carry meaning: the smallest letter in the
group (lexicographically smallest equivalent string), the account owner, the earliest timestamp.
Always link so that the "better" root wins. The second animation links each pair of letters under
the **smaller** letter, so `find(c)` is the smallest letter equivalent to `c`.

**Grids.** Flatten `(r, c)` to `r * cols + c`. Union each land cell with its land neighbours.
Union-find beats flood fill when cells are **added over time** (Number of Islands II).

**Extra data per root.** Keep `size[root]` (largest group), `count` (number of groups), or a
weight to the parent (ratios like `a / b = 2` in "evaluate division").

**Kruskal's minimum spanning tree.** Sort edges by weight; add an edge iff `union` succeeds. The
result connects everything at minimum total cost in O(E log E).

**Offline tricks.** Union-find can't **split** groups. If edges get deleted, process the
operations **in reverse** so deletions become additions.

**Sorting first.** "Connect while the threshold allows" problems (edges up to a weight limit,
cells up to a water level) sort the edges or queries first, then union incrementally.
