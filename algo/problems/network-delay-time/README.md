# Network Delay Time

> Difficulty: **medium** · Patterns: shortest-paths, heap · Sources: [leetcode](https://leetcode.com/problems/network-delay-time/)

## Problem
A network has `n` nodes labelled `1..n`. `times[i] = [u, v, w]` means a signal sent from `u`
reaches `v` after `w` time units (edges are **directed**). A signal starts at node `k`. Return how
long it takes until **every** node has received it, or `-1` if some node never does.

## Examples
- `times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2` → `2`: node 4 is reached last, via 2 → 3 → 4.
- `times = [[1,2,1]], n = 2, k = 1` → `1`.
- `times = [[1,2,1]], n = 2, k = 2` → `-1`: edges are one-way, so node 1 is never reached.

## Constraints
- `1 <= n <= 100`, `1 <= times.length <= 6000`, `0 <= w <= 100`, no duplicate `(u, v)` pairs
  in the original problem (the tests may include parallel edges; take the cheaper one).
- Weights differ, so BFS by edge count is wrong. Target O(E log V).

## Pattern & how to recognise it
- **Weighted** edges, **non-negative** weights, distances from **one source** → **Dijkstra**.
- Every node receives the signal at its shortest-path distance, so the answer is the **largest**
  of those distances (or −1 if any is infinite).
- Lesson: [Shortest Paths](../../learn/shortest-paths/01-intro.md).

## Learning material
- **Dijkstra:** a min-heap of `(distance, node)`. Pop the closest unfinished node; its distance
  is now final; relax its outgoing edges (`dist[v] > d + w` → update and push).
- **Lazy deletion:** the same node can be in the heap several times; skip a popped entry whose
  distance is larger than the best known.
- Complexity O((V + E) log V) with a binary heap. Requires non-negative weights.
- [Dijkstra's algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm)

## Hints
<details><summary>Hint 1</summary>

When does a particular node first hear the signal? How does the whole network's time follow
from those per-node times?
</details>
<details><summary>Hint 2</summary>

Always expand the node that is currently closest to `k`. Which data structure gives you that
node quickly?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Build an adjacency list. Dijkstra from `k` with a min-heap, skipping stale entries. If fewer than
`n` nodes get a final distance, return −1; otherwise return the maximum distance.

Expected complexity: time O(E log V), space O(V + E).

</details>

## Follow-ups
- Some weights are negative (no negative cycles): Bellman-Ford.
- The graph is dense (E ≈ V²): the O(V²) array version of Dijkstra beats the heap version.
- Return the path to the last node reached.
