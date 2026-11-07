# Binary Tree Right Side View

> Difficulty: **medium** · Patterns: bfs · Sources: [leetcode](https://leetcode.com/problems/binary-tree-right-side-view/)

## Problem
Imagine standing to the right of a binary tree. Return the values of the nodes you can see,
from top to bottom. That's the **rightmost node of every level**.

## Examples
- `[1,2,3,null,5,null,4]` → `[1,3,4]`.
- `[1,2,3,4,null,null,null,5]` → `[1,3,4,5]`. The left subtree is deeper, so its nodes show
  on the lower levels.
- `[]` → `[]`.

## Constraints
- `0..100` nodes, values `-100..100`.
- Target: O(n) time.

## Pattern & how to recognise it
- "One value **per level**" → **BFS** level by level. The view is the last node of each level.
- Looking only at right children fails: example 2 shows that the visible node can come from the
  left subtree.
- Lesson: [Breadth-First Search](../../learn/bfs/01-intro.md), variants in
  [what you do with each level](../../learn/bfs/02-variants.md).

## Learning material
- Freezing `size = len(queue)` gives you level boundaries. The `i`-th pop of a level is its
  `i`-th node from the left.
- A DFS alternative: visit right before left, and record a node when its depth is seen for the
  first time.
- [Tree traversal (Wikipedia)](https://en.wikipedia.org/wiki/Tree_traversal)

## Hints
<details><summary>Hint 1</summary>

Can you tell which node is the last one of its level while you are processing the level?
</details>
<details><summary>Hint 2</summary>

Why does following `.right` pointers from the root give the wrong answer for example 2?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Level-order BFS. For each level, pop `size` nodes, push their children left then right, and
append the value of the node popped at index `size - 1`. Time O(n), space O(w).
</details>

## Follow-ups
- Left side view; bottom view; top view (needs horizontal distances).
- Binary Tree Level Order Traversal (LeetCode 102), Zigzag (LeetCode 103).
