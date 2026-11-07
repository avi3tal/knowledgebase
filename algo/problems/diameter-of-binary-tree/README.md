# Diameter of Binary Tree

> Difficulty: **easy** · Patterns: dfs · Sources: [leetcode](https://leetcode.com/problems/diameter-of-binary-tree/)

## Problem
Given the `root` of a binary tree, return the length of its **diameter**: the number of
**edges** on the longest path between any two nodes. The path does not have to pass through the
root.

## Examples
- `[1,2,3,4,5]` → `3` (4 → 2 → 1 → 3, or 5 → 2 → 1 → 3).
- `[1,2]` → `1`.
- `[1,2,null,3,4,5,null,null,6,7,null,null,8]` → `6`. The longest path stays inside the left
  subtree and never reaches the root.

## Constraints
- `1..10^4` nodes, values `-100..100`.
- Target: O(n) time, O(h) space.

## Pattern & how to recognise it
- The answer at a node needs the **heights of both subtrees** → post-order **DFS**.
- Calling a separate `height()` from every node is O(n²) on a skewed tree.
- Lesson: [Depth-First Search](../../learn/dfs/01-intro.md), especially
  [answers built bottom-up](../../learn/dfs/02-variants.md).

## Learning material
- Every path has one highest node. At that node, the path goes down the left side and down the
  right side.
- "Return one thing, record another": the recursion returns a height to the parent, but each node
  also updates a best answer kept outside the recursion.
- [Tree (graph theory): diameter](https://en.wikipedia.org/wiki/Distance_(graph_theory))

## Hints
<details><summary>Hint 1</summary>

For a fixed "highest node" of a path, how long can the path through it be?
</details>
<details><summary>Hint 2</summary>

Can one DFS compute every subtree's height and also check that bound at each node?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`height(node)`: return 0 for `None`. Otherwise compute `l = height(left)` and
`r = height(right)`, update `best = max(best, l + r)`, and return `1 + max(l, r)`. The answer is
`best`. Time O(n), space O(h).
</details>

## Follow-ups
- Binary Tree Maximum Path Sum (LeetCode 124): the same split, with values instead of edges.
- Diameter of an N-ary tree, or of a general tree (two BFS/DFS passes).
