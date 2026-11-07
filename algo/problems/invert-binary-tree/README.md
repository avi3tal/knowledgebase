# Invert Binary Tree

> Difficulty: **easy** · Patterns: multi-threaded, tree-dfs · Sources: [leetcode](https://leetcode.com/problems/invert-binary-tree/)

## Problem
Given the `root` of a binary tree, **mirror** it: swap the left and right child of every node.
Return the root of the inverted tree.

## Examples
- `root = [4, 2, 7, 1, 3, 6, 9]` → `[4, 7, 2, 9, 6, 3, 1]`.
- `root = [2, 1, 3]` → `[2, 3, 1]`.
- `root = []` → `[]`.

## Constraints
- `0 <= number of nodes <= 100`, `-100 <= Node.val <= 100`.
- Every node must be visited once: O(n).

## Pattern & how to recognise it
- On its own this is a plain **tree DFS** (or BFS): visit every node and swap its children.
- It's in this lesson because of the **concurrent follow-up**, a sample problem of the
  DesignGurus **Multi-threaded** pattern. Inverting the left subtree and inverting the right
  subtree touch **disjoint** nodes, so they can run on different threads with no locks.
- Solve the sequential version first. The tests are single-threaded and deterministic.
- Lesson: [Multi-threaded](../../learn/multi-threaded/01-intro.md).

## Learning material
- **Fork–join:** split the work into independent tasks (fork), run them concurrently, wait for
  all of them (join), then combine. Subtrees are a natural split.
- In Python: `concurrent.futures.ThreadPoolExecutor`, `pool.submit(fn, arg)` → a future,
  `future.result()` to join. In Go: goroutines with a `sync.WaitGroup`.
- [concurrent.futures docs](https://docs.python.org/3/library/concurrent.futures.html)

## Hints
<details><summary>Hint 1</summary>

If both subtrees of a node were already inverted, what's left to do at that node?
</details>
<details><summary>Hint 2</summary>

For the concurrent follow-up: do the two recursive calls share any node? Then do they need a
lock?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Recursively: `root.left, root.right = invert(root.right), invert(root.left)`, return `root`.
Or iteratively with a queue/stack, swapping the children of each popped node. Concurrent
version: above a cutoff depth, submit the left subtree to a pool, invert the right one on the
current thread, wait for the future, then swap.

Expected complexity: time O(n), space O(h).

</details>

## Follow-ups
- Make it concurrent with a thread pool (Python) or goroutines (Go). Why must there be a depth
  cutoff, and why won't Python threads speed up this CPU-bound work in the default CPython
  build?
- What happens to the speed-up on a degenerate (list-shaped) tree?
- Check whether a tree is symmetric (mirror of itself).
