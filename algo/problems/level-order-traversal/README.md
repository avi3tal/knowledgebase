# Level Order Traversal (flat)

> Difficulty: **easy** · Patterns: tree-bfs · Sources: [geeksforgeeks](https://www.geeksforgeeks.org/level-order-tree-traversal/)

## Problem
Given the `root` of a binary tree, return the values of all nodes **level by level, left to
right within each level**, as one flat list. LeetCode 102 asks for the same order grouped into one
list per level; that variant is listed under Follow-ups.

## Examples
- `[3,9,20,null,null,15,7]` → `[3,9,20,15,7]`.
- `[15,10,20,8,12,16,25]` → `[15,10,20,8,12,16,25]`. For a complete tree, the level order is
  the array itself.
- `[]` → `[]`.

## Constraints
- `0..2000` nodes, values `-1000..1000`. Trees may be skewed.
- Target: O(n) time, O(w) extra space, where w is the maximum width (up to n/2).

## Pattern & how to recognise it
- **"Level by level", "nearest first", "row by row"** → **BFS with a FIFO queue**. A queue serves
  nodes in the order they were discovered, and children are always discovered one level after
  their parent.
- A per-level recursive approach ("print all nodes at depth d", for d = 1, 2, …) works, but it
  restarts from the root for every level: O(n·h), which is O(n²) on a skewed tree.
- See [algo/notes/trees/binary-tree.md](../../notes/trees/binary-tree.md) and
  [algo/notes/queue.md](../../notes/queue.md).

## Learning material
- **BFS template:** `q = deque([root])`. While `q` is non-empty: `node = q.popleft()`, record it,
  then enqueue its left and right children if they exist. Each node is enqueued and dequeued once:
  O(n).
- **Use a real queue.** `list.pop(0)` in Python is O(n), because it shifts every element. Use
  `collections.deque` (O(1) `popleft`). In Go, use a slice with a head index, or `container/list`.
- **Per-level grouping:** read `len(q)` at the start of each round and pop exactly that many nodes.
  Those nodes form one level.
- [Breadth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Breadth-first_search)

## Hints
<details><summary>Hint 1</summary>

Which data structure gives back items in the order you put them in?
</details>
<details><summary>Hint 2</summary>

When you take a node out, what do you put in?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Start a queue with the root (if any). Repeatedly pop the front, append its value, and push its
left then right child. Time O(n), space O(w).
</details>

## Follow-ups
- Binary Tree Level Order Traversal (LeetCode 102): return `[[3],[9,20],[15,7]]`. Use the level-size trick.
- Zigzag Level Order (LeetCode 103), Right Side View (LeetCode 199), Level Order II (bottom-up, LeetCode 107).
- Minimum Depth (LeetCode 111): BFS stops at the first leaf.
