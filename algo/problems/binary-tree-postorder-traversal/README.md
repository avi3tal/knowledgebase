# Binary Tree Postorder Traversal

> Difficulty: **easy** · Patterns: tree-dfs · Sources: [leetcode](https://leetcode.com/problems/binary-tree-postorder-traversal/)

## Problem
Given the `root` of a binary tree, return the values of its nodes in **postorder** order:
left subtree, right subtree, node.

## Examples
- `[1,null,2,3]` → `[3,2,1]`.
- `[15,10,20,8,12,16,25]` (a complete tree with 15 at the root) → `[8,12,10,16,25,20,15]`.
- `[]` → `[]`.

## Constraints
- `0..100` nodes (LeetCode); values `-100..100`. Trees may be skewed, so the height can be n.
- Target: O(n) time; O(h) extra space for the recursion or stack (h = height, up to n).
  Follow-up: do it iteratively.

## Pattern & how to recognise it
- **Visit every node of a tree in a fixed order** → depth-first traversal. Preorder, inorder and
  postorder differ only in *when* you record the node relative to its two recursive calls.
- Postorder visits a node **after** its children, so it's the order for computing things *bottom-up* (heights, sizes, subtree sums, deleting a tree), where a node needs its children's answers first.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md).

## Learning material
- **Recursive template:** `visit(node)`: if `node` is null, return; otherwise make the two
  recursive calls and record `node.val` at the right moment. Each node is visited once: O(n).
- **Return, don't print.** Collect the values into a list that you pass down (or that the helper
  closes over). Printing makes the result impossible to test or reuse.
- **Recursion depth = tree height.** For a skewed tree with 10^5 nodes, Python's default recursion
  limit (~1000) overflows. The iterative version with an explicit stack avoids this.
- **Iterative postorder:** Iterative: do a modified preorder (node, right, left) with a stack and reverse the result. Or use one stack plus a `last visited` pointer, so you know when a node's right subtree is done.
- **Morris traversal** gets O(1) extra space by temporarily threading right pointers.
- [Tree traversal (Wikipedia)](https://en.wikipedia.org/wiki/Tree_traversal#Depth-first_search)

## Hints
<details><summary>Hint 1</summary>

Write the recursive version first: where does "record the node" go relative to the two recursive calls?
</details>
<details><summary>Hint 2</summary>

To go iterative, simulate the call stack with an explicit stack.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Recursive DFS that appends `node.val` to a result list in postorder position (left subtree, right subtree, node).
Iterative: do a modified preorder (node, right, left) with a stack and reverse the result. Or use one stack plus a `last visited` pointer, so you know when a node's right subtree is done.
Time O(n), space O(h).
</details>

## Follow-ups
- Maximum Depth of Binary Tree and Count Univalue Subtrees: both are postorder computations.
- Binary Tree Maximum Path Sum (LeetCode 124): a postorder that returns one value and tracks another.
- Delete a tree / free memory: children before the parent.
- Morris traversal: O(1) extra space.
