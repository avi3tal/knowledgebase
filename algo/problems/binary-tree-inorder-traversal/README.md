# Binary Tree Inorder Traversal

> Difficulty: **easy** · Patterns: tree-dfs · Sources: [leetcode](https://leetcode.com/problems/binary-tree-inorder-traversal/)

## Problem
Given the `root` of a binary tree, return the values of its nodes in **inorder** order:
left subtree, node, right subtree.

## Examples
- `[1,null,2,3]` → `[1,3,2]`.
- `[15,10,20,8,12,16,25]` (a complete tree with 15 at the root) → `[8,10,12,15,16,20,25]`.
- `[]` → `[]`.

## Constraints
- `0..100` nodes (LeetCode); values `-100..100`. Trees may be skewed, so the height can be n.
- Target: O(n) time; O(h) extra space for the recursion or stack (h = height, up to n).
  Follow-up: do it iteratively.

## Pattern & how to recognise it
- **Visit every node of a tree in a fixed order** → depth-first traversal. Preorder, inorder and
  postorder differ only in *when* you record the node relative to its two recursive calls.
- On a **BST**, inorder visits the keys in **sorted order**. That's why it appears in Validate BST, Kth Smallest in a BST and BST iterators.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md).

## Learning material
- **Recursive template:** `visit(node)`: if `node` is null, return; otherwise make the two
  recursive calls and record `node.val` at the right moment. Each node is visited once: O(n).
- **Return, don't print.** Collect the values into a list that you pass down (or that the helper
  closes over). Printing makes the result impossible to test or reuse.
- **Recursion depth = tree height.** For a skewed tree with 10^5 nodes, Python's default recursion
  limit (~1000) overflows. The iterative version with an explicit stack avoids this.
- **Iterative inorder:** Iterative: walk left pushing nodes onto a stack; pop a node, record it, then go to its right child. Repeat while the stack is non-empty or the current node is not null.
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

Recursive DFS that appends `node.val` to a result list in inorder position (left subtree, node, right subtree).
Iterative: walk left pushing nodes onto a stack; pop a node, record it, then go to its right child. Repeat while the stack is non-empty or the current node is not null.
Time O(n), space O(h).
</details>

## Follow-ups
- Validate Binary Search Tree (LeetCode 98): inorder must be strictly increasing.
- Kth Smallest Element in a BST (LeetCode 230): stop the inorder walk after k nodes.
- Binary Search Tree Iterator (LeetCode 173): the iterative inorder, paused between calls.
- Morris traversal: O(1) extra space.
