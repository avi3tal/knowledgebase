# Same Tree

> Difficulty: **easy** · Patterns: tree-dfs, multi-threaded · Sources: [leetcode](https://leetcode.com/problems/same-tree/)

## Problem
Given the roots of two binary trees `p` and `q`, return `true` if they are **identical**: the
same shape, with equal values in corresponding nodes. Otherwise return `false`.

## Examples
- `p = [1,2,3]`, `q = [1,2,3]` → `true`.
- `p = [1,2]`, `q = [1,null,2]` → `false`: same values, different shape.
- `p = [1,2,1]`, `q = [1,1,2]` → `false`.

## Constraints
- Each tree has `0..100` nodes, values `-10^4..10^4`.
- Target: O(n) time (stop at the first difference), O(h) extra space.

## Pattern & how to recognise it
- **Compare two trees node by node** → a **simultaneous DFS** over both trees. The answer for a
  pair of nodes combines the answers for the pairs of left and right children.
- Serialising both trees and comparing strings also works, but it costs O(n) extra space and
  needs null markers to get shapes right.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md).

## Learning material
- **Three base cases, in this order:** both null → `true`; exactly one null → `false`; values
  differ → `false`. Otherwise recurse on `(p.left, q.left)` and `(p.right, q.right)`.
- **Return real booleans.** In Python, `a and b` returns one of its operands, not a bool. So
  `(p and q) and ...` returns `None` when one side is `None`. That value is falsy, but it isn't
  `False`, so strict checks and typed callers fail. Wrap with `bool(...)` or handle the case
  explicitly.
- Short-circuit `and` stops at the first mismatch.

## Hints
<details><summary>Hint 1</summary>

If the roots match, what must be true of the two left subtrees and the two right subtrees?
</details>
<details><summary>Hint 2</summary>

List every combination of null / non-null for the pair `(p, q)`.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`same(p, q)`: if both are null return true; if one is null return false; return
`p.val == q.val and same(p.left, q.left) and same(p.right, q.right)`. Iteratively, use a
queue or stack of pairs. Time O(n), space O(h).
</details>

## Follow-ups
- Symmetric Tree (LeetCode 101): compare `left` with the mirrored `right`.
- Subtree of Another Tree (LeetCode 572): run same-tree at every node, or use serialisation plus
  string matching.
- Flip Equivalent Binary Trees (LeetCode 951): also allow the children to be swapped.
