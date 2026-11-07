# Path Sum III (Count Paths for a Sum)

> Difficulty: **medium** · Patterns: dfs · Sources: [leetcode](https://leetcode.com/problems/path-sum-iii/)

## Problem
Given the `root` of a binary tree and an integer `targetSum`, count the paths whose node values
add up to `targetSum`. A path may **start and end at any node**, but it must go **downwards**
(from parents to children only).

## Examples
- `[10,5,-3,3,2,null,11,3,-2,null,1]`, `targetSum = 8` → `3`
  (5 → 3, 5 → 2 → 1, -3 → 11).
- `[5,4,8,11,null,13,4,7,2,null,null,5,1]`, `targetSum = 22` → `3`.
- `[1,2,3]`, `targetSum = 6` → `0`. 2 → 1 → 3 isn't a downward path.

## Constraints
- `0..1000` nodes, values `-10^9..10^9`, `-1000 <= targetSum <= 1000`.
- Values can be negative and sums can exceed 32 bits (use 64-bit integers in Go).
- Target: O(n) time, O(h) space for the recursion plus O(h) for the map.

## Pattern & how to recognise it
- Paths in a tree that **go downwards** → **DFS**, which keeps the current root-to-node path
  on its stack.
- The naive way runs a DFS from every node: O(n²) on a skewed tree.
- Any downward path ending at the current node is a **suffix** of the root-to-node path. Sums of
  contiguous pieces suggest **prefix sums**, as in "subarray sum equals K".
- This is the "Count Paths for a Sum" sample from the DesignGurus patterns list.
- Lesson: [Depth-First Search](../../learn/dfs/01-intro.md), especially
  [paths with a target](../../learn/dfs/02-variants.md).

## Learning material
- Prefix sums on a path: if `prefix(here) - prefix(earlier) == target`, the piece between them
  sums to the target.
- A hash map of prefix-sum counts **for the current root-to-node path only**. Add on the way
  down, remove on the way back up, so that other branches never see it.
- [Prefix sum (Wikipedia)](https://en.wikipedia.org/wiki/Prefix_sum)

## Hints
<details><summary>Hint 1</summary>

First write the O(n²) version: for each node, count the downward paths that start there.
</details>
<details><summary>Hint 2</summary>

For a fixed end node, how many earlier prefix sums on the path from the root give the target?
</details>
<details><summary>Hint 3</summary>

When does a prefix sum stop being "on the current path"?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

DFS with a running `prefix` and a map `count` initialised to `{0: 1}`. At each node:
`prefix += node.val`, `ans += count[prefix - target]`, `count[prefix] += 1`, recurse into both
children, then `count[prefix] -= 1` before returning. Time O(n), space O(h).
</details>

## Follow-ups
- Path Sum II (LeetCode 113): list the root-to-leaf paths.
- Subarray Sum Equals K (LeetCode 560): the same prefix-sum trick on an array.
