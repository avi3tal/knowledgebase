# Count Univalue Subtrees

> Difficulty: **medium** · Patterns: tree-dfs · Sources: [leetcode](https://leetcode.com/problems/count-univalue-subtrees/), [interviewbit](https://www.youtube.com/watch?v=7HgsS8bRvjo)

## Problem
Given the `root` of a binary tree, return the number of **univalue subtrees**. A univalue
(unival) subtree is a node together with all its descendants, where every node has the same
value. Every leaf is one. An empty tree has none.

## Examples
- `[5,1,5,5,5,null,5]` → `4`: the three leaves `5`, plus the right child `5` with its leaf `5`.
- ```
      0
     / \
    1   0
       / \
      1   0
     / \
    1   1
  ```
  → `5`: the leaves `1`, `1`, `1` and `0`, and the subtree `1(1,1)`.
- `[]` → `0`.

## Constraints
- `0..1000` nodes, values `-1000..1000`.
- Target: O(n) time, O(h) extra space. Checking "is this subtree unival?" separately at every
  node is O(n²) on a skewed tree.

## Pattern & how to recognise it
- **A property of every subtree that depends on the same property of its children** → **postorder
  DFS that returns more than one thing**: here, the count of unival subtrees below, plus whether
  this subtree is unival.
- The naive version calls `is_unival(node)` at every node, and each call walks the whole subtree
  again: O(n²) for a skewed tree.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md).

## Learning material
- **Return a pair from the recursion:** `(count, is_unival)`. A node is unival iff both
  children are unival (null counts as unival) **and** each existing child has the node's value.
  If so, add 1 to the children's counts.
- **Don't short-circuit the recursion.** If you write `left_ok and right_ok` with the recursive
  calls inline, the right subtree is never visited when the left one fails, and its uni-value
  subtrees are never counted. Always evaluate both children first.
- This "return extra info upward" technique is the same one used for Balanced Binary Tree,
  Diameter, and Maximum Path Sum.

## Hints
<details><summary>Hint 1</summary>

What does a node need to know about each child to decide whether its own subtree is unival?
</details>
<details><summary>Hint 2</summary>

Can one recursive call return both the count and that yes/no?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dfs(node) -> (count, ok)`: null → `(0, True)`. Compute both children first, then
`ok = left_ok and right_ok and (no left child or left.val == node.val) and (no right child or
right.val == node.val)`. Return `(lc + rc + ok, ok)`. Time O(n), space O(h).
</details>

## Follow-ups
- Longest Univalue Path (LeetCode 687): the longest path with equal values, using the same
  postorder shape.
- Count subtrees whose sum equals a target, or the largest BST subtree (LeetCode 333): return a
  tuple of facts per subtree.
- Iterative postorder version for deep trees.
