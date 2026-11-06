# Binary Tree Preorder Traversal

> Difficulty: **easy** · Patterns: tree-dfs · Sources: [leetcode](https://leetcode.com/problems/binary-tree-preorder-traversal/)

## Problem
Given the `root` of a binary tree, return the values of its nodes in **preorder** order:
node, left subtree, right subtree.

## Examples
- `[1,null,2,3]` → `[1,2,3]`.
- `[15,10,20,8,12,16,25]` (a complete tree with 15 at the root) → `[15,10,8,12,20,16,25]`.
- `[]` → `[]`.

## Constraints
- `0..100` nodes (LeetCode); values `-100..100`. Trees may be skewed, so the height can be n.
- Target: O(n) time; O(h) extra space for the recursion or stack (h = height, up to n).
  Follow-up: do it iteratively.

## Pattern & how to recognise it
- **Visit every node of a tree in a fixed order** → depth-first traversal. Preorder, inorder and
  postorder differ only in *when* you record the node relative to its two recursive calls.
- Preorder visits a node **before** its children, so it's the order for **copying/serialising** a tree (Serialize and Deserialize Binary Tree) and for passing information *down* from parent to child.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md).

## Learning material
- **Recursive template:** `visit(node)`: if `node` is null, return; otherwise make the two
  recursive calls and record `node.val` at the right moment. Each node is visited once: O(n).
- **Return, don't print.** Collect the values into a list that you pass down (or that the helper
  closes over). Printing makes the result impossible to test or reuse.
- **Recursion depth = tree height.** For a skewed tree with 10^5 nodes, Python's default recursion
  limit (~1000) overflows. The iterative version with an explicit stack avoids this.
- **Iterative preorder:** Iterative: push the root. Pop a node and record it, then push its **right** child before its **left** child, so the left one is popped first.
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

Recursive DFS that appends `node.val` to a result list in preorder position (node, left subtree, right subtree).
Iterative: push the root. Pop a node and record it, then push its **right** child before its **left** child, so the left one is popped first.
Time O(n), space O(h).
</details>

## Follow-ups
- Serialize and Deserialize Binary Tree (LeetCode 297): preorder with null markers.
- Construct Binary Tree from Preorder and Inorder Traversal (LeetCode 105).
- Flatten Binary Tree to Linked List (LeetCode 114): the list follows preorder.
- Morris traversal: O(1) extra space.
