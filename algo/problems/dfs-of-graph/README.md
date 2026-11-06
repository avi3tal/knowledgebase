# DFS of a Graph

> Difficulty: **easy** · Patterns: graph-dfs · Sources: [educative](https://www.educative.io/courses/data-structures-coding-interviews-python)

## Problem
A directed graph with `n` nodes `0..n-1` is given as an adjacency list: `graph[i]` lists the
nodes that `i` has edges to. Starting from `start`, return the nodes in **depth-first preorder**:
record a node when you first reach it, then fully explore each neighbour **in the order it appears
in `graph[i]`** before moving to the next one (the order a recursive DFS produces). Each reachable
node appears once; unreachable nodes are not included.

## Examples
- `graph = [[1,2],[3,4],[5],[],[5],[]]`, `start = 0` → `[0,1,3,4,5,2]`. This is the course's
  A..F example, with A=0 … F=5: `A B D E F C`.
- `graph = [[1],[2],[0]]`, `start = 0` → `[0,1,2]`.
- `graph = [[3,1,2],[4],[4],[],[0]]`, `start = 0` → `[0,3,1,4,2]`.

## Constraints
- `1 <= n <= 10^4`, `0 <= start < n`, up to `10^5` edges; self-loops and duplicate edges may
  appear. Paths can be up to n nodes deep.
- Target: O(V + E) time, O(V) extra space.

## Pattern & how to recognise it
- **Explore as deep as possible before backtracking**: reachability, connected components,
  cycle detection, topological sort, path existence → **DFS with a visited set**.
- Recursion is the natural way to write it, but the recursion depth equals the path length. A long
  chain of 10^4 nodes overflows Python's default limit (~1000), so learn the explicit-stack form.
- See [algo/notes/graphs.md](../../notes/graphs.md) and the reference code in
  [algo/ds/graph/python](../../ds/graph/python).

## Learning material
- **Recursive template:** `dfs(u)`: mark `u` visited, record it, then for each `v` in `graph[u]`,
  if `v` isn't visited, call `dfs(v)`.
- **Iterative, with the same order:** push `start`. Pop `u`; if it's already visited, skip it.
  Otherwise mark it, record it, and push its neighbours in **reverse** order, so the first
  neighbour is popped first. Mark on **pop**, not on push, or the order differs from the recursive one.
- **Cost:** O(V + E). Each node is expanded once, and each edge is looked at once.
- Pre-order vs post-order on graphs: post-order (record after the children) gives a reverse
  topological order on a DAG.
- [Depth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Depth-first_search)

## Hints
<details><summary>Hint 1</summary>

What happens on a cycle if you don't remember where you've been?
</details>
<details><summary>Hint 2</summary>

To replace recursion with a stack, in what order should the neighbours be pushed so the first one
is explored first?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Recursive DFS with a visited set, recording nodes in preorder and iterating over the neighbours
in list order. Or the explicit-stack version: mark on pop, push the neighbours reversed.
Time O(V + E), space O(V).
</details>

## Follow-ups
- Number of connected components / Number of Islands (LeetCode 200).
- Cycle detection in a directed graph: three colours (white/grey/black). Course Schedule (LeetCode 207).
- Topological sort via DFS post-order (LeetCode 210).
- All paths from source to target (LeetCode 797): DFS with backtracking.
- [BFS of a Graph](../bfs-of-graph/README.md): the same exploration with a queue.
