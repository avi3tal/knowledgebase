# Path Sum

> Difficulty: **easy** · Patterns: dfs · Sources: [leetcode](https://leetcode.com/problems/path-sum/)

## Problem
Given the `root` of a binary tree and an integer `targetSum`, return `true` if some
**root-to-leaf** path has node values that add up to `targetSum`. A leaf is a node with no
children.

## Examples
- `[5,4,8,11,null,13,4,7,2,null,null,null,1]`, `targetSum = 22` → `true` (5 → 4 → 11 → 2).
- `[1,2,3]`, `targetSum = 5` → `false`. The paths sum to 3 and 4.
- `[1,2]`, `targetSum = 1` → `false`. The root is not a leaf, so the path must go on to 2.

## Constraints
- `0..5000` nodes, values `-1000..1000`, `-1000 <= targetSum <= 1000`.
- Values can be negative, so you can't stop early just because the sum got too big.
- Target: O(n) time, O(h) space.

## Pattern & how to recognise it
- "**Root-to-leaf** path" with a condition → **DFS**, passing state (the remaining sum) down the
  recursion.
- Listing every path first and then summing them costs O(n·h) time and memory.
- Lesson: [Depth-First Search](../../learn/dfs/01-intro.md).

## Learning material
- Pre-order work: subtract `node.val` from the remaining target on the way down.
- The check belongs at a **leaf**, not at a `None` child. A node with one child is not the end
  of a path.
- [Depth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Depth-first_search)

## Hints
<details><summary>Hint 1</summary>

What does a child need to know from its parent to continue the search?
</details>
<details><summary>Hint 2</summary>

Where exactly should the "did we hit the target?" test happen?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dfs(node, remaining)`: if `node` is None, return False. Set `remaining -= node.val`. At a leaf,
return `remaining == 0`. Otherwise return `dfs(left, remaining) or dfs(right, remaining)`.
Time O(n), space O(h).
</details>

## Follow-ups
- Path Sum II (LeetCode 113): return every such path. Use a path list and backtracking.
- Path Sum III (LeetCode 437): paths may start and end anywhere going down.
- Sum Root to Leaf Numbers (LeetCode 129).
