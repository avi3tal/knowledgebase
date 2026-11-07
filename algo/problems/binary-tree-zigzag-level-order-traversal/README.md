# Binary Tree Zigzag Level Order Traversal

> Difficulty: **medium** · Patterns: bfs · Sources: [leetcode](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/)

## Problem
Given the `root` of a binary tree, return its node values level by level, as a list of lists.
Read the first level **left to right**, the next **right to left**, and keep alternating.

## Examples
- `[3,9,20,null,null,15,7]` → `[[3],[20,9],[15,7]]`.
- `[1]` → `[[1]]`.
- `[]` → `[]`.

## Constraints
- `0..2000` nodes, values `-100..100`.
- Target: O(n) time, O(w) extra space besides the output.

## Pattern & how to recognise it
- "**Level order**", grouped per level → **BFS** with level boundaries. The zigzag only changes
  how each level is *written down*, not the order you visit nodes in.
- Pushing children in reverse order on odd levels breaks the next level. Keep the traversal
  normal and flip the output.
- Lesson: [Breadth-First Search](../../learn/bfs/01-intro.md).

## Learning material
- Level-by-level BFS with `size = len(queue)`.
- To build a level in reverse, either reverse the finished list (O(level) extra work, O(n) in
  total) or fill it from the right using a deque / preallocated list.
- [Breadth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Breadth-first_search)

## Hints
<details><summary>Hint 1</summary>

First produce plain level order as a list of lists. What is the smallest change that gives the
zigzag?
</details>
<details><summary>Hint 2</summary>

Keep a boolean that flips after every level.
</details>

## Approach (spoiler)
<details><summary>Show</summary>

BFS by levels. Collect each level's values in visiting order, reverse the list on odd levels,
and append it. Time O(n), space O(w).
</details>

## Follow-ups
- Two stacks instead of a queue (push children in opposite orders).
- Binary Tree Level Order Traversal II (LeetCode 107): bottom-up.
