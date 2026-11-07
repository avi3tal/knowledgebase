# Minimum Depth of Binary Tree

> Difficulty: **easy** · Patterns: bfs · Sources: [leetcode](https://leetcode.com/problems/minimum-depth-of-binary-tree/)

## Problem
Given the `root` of a binary tree, return its **minimum depth**: the number of nodes on the
shortest path from the root down to the nearest **leaf**. A leaf is a node with no children. An
empty tree has depth `0`.

## Examples
- `[3,9,20,null,null,15,7]` → `2` (3 → 9).
- `[2,null,3,null,4,null,5,null,6]` → `5`. The only leaf is at the bottom of the chain.
- `[1,2]` → `2`. The root has a child, so it is not a leaf.

## Constraints
- `0..10^5` nodes, values `-1000..1000`. Trees can be very skewed.
- Target: O(n) time in the worst case, but stop as soon as the nearest leaf is found.

## Pattern & how to recognise it
- "**Nearest** leaf", "**shortest** path from the root" → **BFS** by levels. The first leaf you
  pop is on the shallowest level, so you can return right away.
- DFS also works, but it must explore the whole tree to be sure nothing shallower exists.
- Lesson: [Breadth-First Search](../../learn/bfs/01-intro.md).

## Learning material
- Level-by-level BFS: `size = len(queue)`, pop `size` nodes, push their children, then
  `depth += 1`.
- The leaf test is `node.left is None and node.right is None`. A missing child does not make a
  node a leaf.
- [Breadth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Breadth-first_search)

## Hints
<details><summary>Hint 1</summary>

If you visit the tree level by level, when can you stop?
</details>
<details><summary>Hint 2</summary>

`1 + min(depth(left), depth(right))` is wrong for a node that has only one child. Why?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

If the root is `None`, return 0. BFS with `depth = 1`. For each level, pop its nodes. If a popped
node is a leaf, return `depth`. Otherwise push its non-null children. After the level,
`depth += 1`. Time O(n), space O(w) for the widest level.
</details>

## Follow-ups
- Maximum Depth (LeetCode 104): DFS is the natural fit there.
- Closest leaf to a given node (LeetCode 742): turn the tree into a graph, then BFS.
