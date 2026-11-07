# Cheapest Flights Within K Stops

> Difficulty: **medium** · Patterns: shortest-paths, dp-1d · Sources: [leetcode](https://leetcode.com/problems/cheapest-flights-within-k-stops/)

## Problem
There are `n` cities `0..n-1` and directed `flights[i] = [from, to, price]`. Return the cheapest
price to fly from `src` to `dst` using **at most `k` stops** (intermediate cities), or `-1` if no
such route exists.

## Examples
- `n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1`
  → `700`: 0 → 1 → 3. The cheaper 0 → 1 → 2 → 3 (400) needs 2 stops.
- `n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1` → `200`.
- Same flights with `k = 0` → `500`: only the direct flight is allowed.

## Constraints
- `1 <= n <= 100`, `0 <= flights.length <= n·(n−1)/2`, `1 <= price <= 10^4`, `0 <= k < n`.
- No two flights share the same `(from, to)`. `src != dst` in the original problem (the tests
  include `src == dst`, which costs 0).

## Pattern & how to recognise it
- Cheapest weighted path **with a limit on the number of edges** → plain Dijkstra is wrong: it
  finalises a city at its cheapest price even when that route used too many stops, and a pricier
  route with fewer stops might be the only one that can continue.
- **Bellman-Ford limited to k + 1 rounds** fits exactly: after round i, `dist` holds the cheapest
  price using at most i flights.
- Lesson: [Shortest Paths](../../learn/shortest-paths/01-intro.md).

## Learning material
- **Bellman-Ford:** repeat "relax every edge" V − 1 times. Round i finalises all shortest paths
  that use ≤ i edges. O(V·E). It also handles negative weights and detects negative cycles.
- **The copy trick:** relax from a **snapshot** of the previous round's distances. Otherwise one
  round can chain several edges and break the edge limit.
- Alternative: Dijkstra/BFS over states `(city, stops used)`.
- [Bellman–Ford algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm)

## Hints
<details><summary>Hint 1</summary>

"At most k stops" = "at most k + 1 flights". What do you know after considering all routes of at
most 1 flight? Of at most 2?
</details>
<details><summary>Hint 2</summary>

If you update `dist` in place while scanning the flights, one round could use two flights. How
do you prevent that?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

`dist = [inf] * n; dist[src] = 0`. Repeat `k + 1` times: `nxt = dist.copy()`; for each flight
`(u, v, p)` with `dist[u] < inf`, set `nxt[v] = min(nxt[v], dist[u] + p)`; then `dist = nxt`.
Return `dist[dst]` or −1.

Expected complexity: time O(k · E), space O(n).

</details>

## Follow-ups
- Return the route itself.
- Solve it with a heap over `(cost, city, stops)` and compare.
- Why does Dijkstra with a plain `visited` set fail here? Build a counterexample.
