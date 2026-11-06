# Maximum Depth of Binary Tree

> Difficulty: **easy** · Patterns: tree-dfs · Sources: [leetcode](https://leetcode.com/problems/maximum-depth-of-binary-tree/)

## Problem
Given the `root` of a binary tree, return its **maximum depth**: the number of nodes on the
longest path from the root down to a leaf. An empty tree has depth 0.

## Examples
- `[3,9,20,null,null,15,7]` → `3`: the path 3 → 20 → 15.
- `[1,null,2]` → `2`.
- `[]` → `0`.

## Constraints
- `0..10^4` nodes, values `-100..100`. Skewed trees are allowed, so the depth can be n.
- Target: O(n) time, O(h) extra space.

## Pattern & how to recognise it
- **A property of the whole tree that combines its subtrees' answers** → **postorder DFS**: depth
  = 1 + max(depth(left), depth(right)), with depth(null) = 0.
- Alternatively, **BFS level by level**: the depth is the number of levels.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md).

## Learning material
- **Depth vs height:** LeetCode counts **nodes** on the path, so a single node has depth 1. Some
  textbooks count **edges** (a single node has height 0). Read the definition every time.
- **Recursion:** the base case is a null node, which returns 0. Each node is visited once: O(n)
  time and O(h) stack, which is O(log n) for a balanced tree and O(n) for a skewed one.
- **Iterative:** BFS with a queue, counting levels. Or DFS with an explicit stack of
  `(node, depth)` pairs. Both avoid the recursion limit on deep trees.
- [Tree (Wikipedia: terminology)](https://en.wikipedia.org/wiki/Tree_(data_structure)#Terminology)

## Hints
<details><summary>Hint 1</summary>

If you knew the depths of both subtrees, what's the depth of the tree?
</details>
<details><summary>Hint 2</summary>

What should an empty subtree return so that a leaf comes out as depth 1?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`depth(null) = 0`, `depth(node) = 1 + max(depth(node.left), depth(node.right))`. Or use BFS and
count the levels. Time O(n), space O(h) for DFS and O(width) for BFS.
</details>

## Follow-ups
- Minimum Depth of Binary Tree (LeetCode 111): careful, a node with one child is not a leaf. BFS
  can stop at the first leaf.
- Balanced Binary Tree (LeetCode 110): compute the heights and check the difference, in one pass.
- Diameter of Binary Tree (LeetCode 543): a height computation that also tracks left + right.
