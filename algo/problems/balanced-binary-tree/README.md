# Balanced Binary Tree

> Difficulty: **easy** · Patterns: trees, dfs · Sources: [leetcode](https://leetcode.com/problems/balanced-binary-tree/)

## Problem
A binary tree is **height-balanced** when, at **every** node, the heights of the left and right
subtrees differ by at most one. Given the `root` of a binary tree, return `true` if it is
height-balanced and `false` otherwise. An empty tree is balanced.

## Examples
- `root = [3, 9, 20, null, null, 15, 7]` → `true`. The root's subtrees have heights 1 and 2.
- `root = [1, 2, 2, 3, 3, null, null, 4, 4]` → `false`. The root's left subtree has height 3, the
  right one height 1.
- `root = [1, 2, 2, 3, null, null, 3, 4, null, null, 4]` → `false`. The root itself looks fine
  (heights 3 and 3), but each child has one subtree of height 2 and an empty one.

## Constraints
- `0 <= number of nodes <= 5000`, `-10^4 <= Node.val <= 10^4`.
- The tree can be a long chain, so aim for one pass: O(n).

## Pattern & how to recognise it
- "At **every** node, compare something about the two subtrees" → a **post-order** traversal:
  each call returns a summary of its subtree (here its height) to the parent.
- The naive version calls a separate `height()` from every node, which re-walks each subtree
  again and again: O(n²) on a chain. Returning the height *and* the verdict from one recursion
  makes it O(n).
- Lesson: [Trees](../../learn/trees/01-intro.md).

## Learning material
- **Height** of a node = number of nodes on the longest downward path (empty tree = 0). It is
  `1 + max(height(left), height(right))`, so it is naturally computed bottom-up.
- **Post-order** (left, right, node) is the traversal order for "the answer at a node depends on
  answers from its children".
- A common trick: return a sentinel such as `-1` to mean "this subtree is already unbalanced", so
  the failure short-circuits up the tree.
- [Tree traversals (Wikipedia)](https://en.wikipedia.org/wiki/Tree_traversal)

## Hints
<details><summary>Hint 1</summary>

Suppose a helper already told you the heights of the two child subtrees. What do you check at
this node, and what height do you report upwards?
</details>
<details><summary>Hint 2</summary>

How can the helper report "unbalanced somewhere below" without a second return value?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Post-order helper `h(node)`: return 0 for an empty node; compute `l = h(left)`, `r = h(right)`;
if either is `-1` or `|l - r| > 1` return `-1`; otherwise return `1 + max(l, r)`. The tree is
balanced iff `h(root) != -1`.

Expected complexity: time O(n), space O(h) for the recursion.

</details>

## Follow-ups
- Return the deepest node at which the balance condition first fails.
- Rebalance a BST: in-order to a sorted list, then rebuild from the middle.
- How does this differ from checking that a tree is *complete*?
