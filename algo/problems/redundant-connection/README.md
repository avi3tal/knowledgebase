# Redundant Connection

> Difficulty: **medium** · Patterns: union-find · Sources: [leetcode](https://leetcode.com/problems/redundant-connection/)

## Problem
A tree with `n` nodes labelled `1..n` had **one extra edge** added between two distinct nodes,
so the graph now has exactly one cycle. You get the `n` undirected `edges`. Return an edge whose
removal turns the graph back into a tree. If several edges would work, return the one that
appears **last** in `edges`.

## Examples
- `edges = [[1,2],[1,3],[2,3]]` → `[2,3]`.
- `edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]` → `[1,4]`: the cycle is 1–2–3–4–1, and `[1,4]` is
  the last of its edges in the list.

## Constraints
- `3 <= n <= 1000`, `edges.length == n`, `1 <= a, b <= n`, `a != b`, no repeated edges.
- Removing each edge and re-checking connectivity is O(n²). Aim for O(n · α(n)).

## Pattern & how to recognise it
- Edges arrive in order, and you need the first edge that **connects two nodes that are
  already connected** → that's a cycle-closing edge, which union-find detects in O(α(n)).
- Why it's also the **last** cycle edge in the list: the only cycle closes exactly when its
  final edge (in input order) is processed.
- Lesson: [Union-Find](../../learn/union-find/01-intro.md).

## Learning material
- In union-find, `find(a) == find(b)` before adding edge (a, b) means a path a ⇝ b already
  exists, so the new edge would close a cycle.
- Use path compression + union by rank for near-constant operations.
- [Disjoint-set data structure (Wikipedia)](https://en.wikipedia.org/wiki/Disjoint-set_data_structure)

## Hints
<details><summary>Hint 1</summary>

Add the edges one at a time to an initially empty graph. When does an edge become redundant?
</details>
<details><summary>Hint 2</summary>

How can you tell in near-constant time whether two nodes are already connected?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Union-find over `1..n`. For each edge `[a, b]` in order: if `find(a) == find(b)` return
`[a, b]`; otherwise union them.

Expected complexity: time O(n · α(n)), space O(n).

</details>

## Follow-ups
- Redundant Connection II: directed edges, the result must be a rooted tree (one node may have
  two parents).
- Return every edge on the cycle (DFS to recover the path).
