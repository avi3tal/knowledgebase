# Validate Binary Search Tree

> Difficulty: **medium** · Patterns: trees, dfs · Sources: [leetcode](https://leetcode.com/problems/validate-binary-search-tree/)

## Problem
Given the `root` of a binary tree, decide whether it is a valid **binary search tree**:
- every value in a node's **left subtree** is strictly smaller than the node's value,
- every value in its **right subtree** is strictly greater,
- and both subtrees are themselves valid BSTs.

Duplicates are not allowed. An empty tree is a valid BST.

## Examples
- `root = [2, 1, 3]` → `true`.
- `root = [5, 1, 4, null, null, 3, 6]` → `false`: 4 is in the right subtree of 5 but smaller.
- `root = [5, 4, 6, null, null, 3, 7]` → `false`: every parent/child pair looks right, but 3 sits
  in the right subtree of 5.

## Constraints
- `0 <= number of nodes <= 10^4`, `-2^31 <= Node.val <= 2^31 - 1` (the extreme values can appear).
- One pass over the tree: O(n).

## Pattern & how to recognise it
- "Is this a BST?" is about the **BST invariant**, which is a statement about whole subtrees,
  not just parent and child. Checking only `left.val < node.val < right.val` is the classic bug
  (third example).
- Two standard ways to carry the global constraint: pass an **allowed range** down the
  recursion, or use the fact that an **in-order traversal** of a BST is strictly increasing.
- Lesson: [Trees](../../learn/trees/01-intro.md).

## Learning material
- **BST invariant:** for every node, all keys on the left < key < all keys on the right. It gives
  O(h) search/insert/delete and a sorted in-order traversal.
- **Range passing (pre-order):** each node must lie inside an open interval `(lo, hi)`; going
  left tightens `hi`, going right tightens `lo`.
- **In-order:** visit left, node, right and remember the previous value; any value ≤ the
  previous one breaks the invariant.
- [Binary search tree (Wikipedia)](https://en.wikipedia.org/wiki/Binary_search_tree)

## Hints
<details><summary>Hint 1</summary>

In the third example, which ancestor does 3 violate? What information about that ancestor would
the node holding 3 need to know?
</details>
<details><summary>Hint 2</summary>

Pass two bounds down the recursion. What are they at the root, and how do they change when you
go left or right? Watch out for values equal to the 32-bit limits.
</details>
<details><summary>Hint 3</summary>

Alternatively: what does an in-order walk of a valid BST produce?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`ok(node, lo, hi)`: an empty node is valid; otherwise require `lo < node.val < hi` and recurse
with `ok(left, lo, node.val)` and `ok(right, node.val, hi)`. Start with `lo = -inf`,
`hi = +inf` (use `None` or a wider type so the 32-bit extremes still pass). Or do an iterative
in-order traversal and check the sequence is strictly increasing.

Expected complexity: time O(n), space O(h).

</details>

## Follow-ups
- Allow duplicates on the left (`<=`): what changes?
- Recover a BST where exactly two nodes were swapped (in-order finds the two out-of-order spots).
- Find the k-th smallest value in a BST.
