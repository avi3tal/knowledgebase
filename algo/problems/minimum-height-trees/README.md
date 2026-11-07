# Minimum Height Trees

> Difficulty: **medium** · Patterns: topological-sort · Sources: [leetcode](https://leetcode.com/problems/minimum-height-trees/)

## Problem
You're given an undirected **tree** with `n` nodes labelled `0 … n - 1` as a list of `n - 1`
edges. You may choose any node as the root. The height of the rooted tree is the number of
edges on the longest root-to-leaf path. Return **all** roots that give the minimum height, in
any order.

## Examples
- `n = 4, edges = [[1, 0], [1, 2], [1, 3]]` → `[1]`: a star, rooted at its centre.
- `n = 6, edges = [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]]` → `[3, 4]`.
- `n = 1, edges = []` → `[0]`.

## Constraints
- `1 <= n <= 2 * 10^4`, `len(edges) == n - 1`, the edges form a tree.
- A BFS from every node is O(n²) = 4·10⁸. Too slow. The target is O(n).

## Pattern & how to recognise it
- At first glance it's a BFS problem, but the trick is **Kahn-style peeling**. Use the
  **degree** instead of the in-degree: repeatedly remove all current leaves (degree 1). The
  last layer standing is the answer.
- The PDF files this under **Topological Sort**: the same queue of "ready" nodes, the same
  decrement-and-enqueue loop.
- Lesson: [Topological Sort](../../learn/topological-sort/02-variants.md).

## Learning material
- **Centre of a tree:** the node(s) minimising the maximum distance to any other node. A tree
  has one or two centres, and they lie in the middle of a longest path (diameter).
- **Leaf peeling:** removing every leaf shortens every longest path by 2 (one edge at each end)
  and doesn't move the middle.
- [Tree centre (cp-algorithms, tree diameter)](https://cp-algorithms.com/graph/tree_diameter.html)

## Hints
<details><summary>Hint 1</summary>

How many minimum-height roots can a tree have at most? Where are they relative to the longest
path?
</details>
<details><summary>Hint 2</summary>

Leaves are never the answer (unless n ≤ 2). What happens if you delete all of them at once?
</details>
<details><summary>Hint 3</summary>

Track each node's degree, like in-degrees in Kahn's algorithm. Remove a whole layer of leaves
per round.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If `n <= 2`, return all nodes. Compute degrees and queue every leaf. While more than 2 nodes
remain: pop the current layer of leaves, subtract them from `remaining`, and for each
neighbour decrement its degree, enqueuing it when it becomes 1. The nodes left in the queue
are the answer.

Expected complexity: time O(n), space O(n).

</details>

## Follow-ups
- Return the minimum height itself.
- Find the tree's diameter (two BFS runs).
- Weighted edges: the centre is no longer found by counting layers.
