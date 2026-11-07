# Binary Tree Maximum Path Sum

> Difficulty: **hard** · Patterns: trees, dfs · Sources: [leetcode](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

## Problem
A **path** in a binary tree is a sequence of nodes where each consecutive pair is connected by an
edge and no node appears twice. A path does not have to pass through the root and can bend at
most once (go up, then down). Its **sum** is the total of its node values.

Given the non-empty tree `root`, return the largest sum of any non-empty path.

## Examples
- `root = [1, 2, 3]` → `6`: the path 2 → 1 → 3.
- `root = [-10, 9, 20, null, null, 15, 7]` → `42`: the path 15 → 20 → 7 (it skips the root).
- `root = [-3]` → `-3`: a path needs at least one node, even a negative one.

## Constraints
- `1 <= number of nodes <= 3 * 10^4`, `-1000 <= Node.val <= 1000`.
- Values can be negative, so "take everything" is wrong. Target O(n).

## Pattern & how to recognise it
- An answer that can live **anywhere** in the tree and is built from parts of two subtrees →
  **post-order** DFS where each call returns one thing to its parent but updates a global best
  with something else.
- The key split: what a node **returns upward** (a path that goes down one side only, since the
  parent extends it) versus what it **records** (a path that bends at this node, using both sides).
- Same shape as *diameter of a binary tree*, with sums instead of edge counts.
- Lesson: [Trees](../../learn/trees/01-intro.md).

## Learning material
- **Return vs record:** many hard tree problems need two values per node. The return value must
  be *extendable* by the parent; the recorded value is a complete answer candidate.
- **Dropping negative branches:** a child's best downward sum that is negative only hurts, so
  clamp it to 0 (take the empty branch).
- [Tree DP notes (cp-algorithms, DP on trees)](https://cp-algorithms.com/)

## Hints
<details><summary>Hint 1</summary>

Fix the highest node of the path. What does the best path that bends at that node look like?
</details>
<details><summary>Hint 2</summary>

Let `down(node)` be the best sum of a path that starts at `node` and goes downward. Express it via
the children's `down` values. When is a child's contribution worth taking?
</details>
<details><summary>Hint 3</summary>

At each node, the candidate answer uses both children's contributions plus the node itself; the
value returned to the parent may use only one of them.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Post-order: `gain(node)` returns 0 for an empty node; `l = max(gain(left), 0)`,
`r = max(gain(right), 0)`; update `best = max(best, node.val + l + r)`; return
`node.val + max(l, r)`. Initialise `best` to negative infinity (or the root's value) so an
all-negative tree returns its largest single value.

Expected complexity: time O(n), space O(h).

</details>

## Follow-ups
- Return the path itself, not just its sum.
- Paths must start at the root / end at a leaf: how does it simplify?
- Same question on a general tree (n-ary): keep the top two child gains.
