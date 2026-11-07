"""Worked example (Dijkstra with path reconstruction): cheapest route between two nodes.

roads[i] = [a, b, cost] is an undirected road. Return [total cost, route] or [-1, []].

Reference code for the lesson animation; `# note:` comments become the narration.
"""

import heapq


def cheapest_route(n: int, roads: list[list[int]], src: int, dst: int) -> list:
    graph: dict[int, list[tuple[int, int]]] = {i: [] for i in range(n)}
    for a, b, cost in roads:
        graph[a].append((b, cost))
        graph[b].append((a, cost))
    dist = {src: 0}
    prev: dict[int, int] = {}
    heap = [(0, src)]  # note: min-heap of (distance so far, node)
    while heap:
        d, node = heapq.heappop(heap)  # note: pop the closest node — its distance is now final
        if node == dst:
            break  # note: the target is final — stop early
        if d > dist[node]:
            continue  # note: stale entry — a shorter route to this node was already processed
        for nxt, w in graph[node]:
            if d + w < dist.get(nxt, float("inf")):
                dist[nxt] = d + w  # note: relax — a cheaper route to nxt goes through node
                prev[nxt] = node
                heapq.heappush(heap, (d + w, nxt))
    if dst not in dist:
        return [-1, []]
    route = [dst]
    while route[-1] != src:
        route.append(prev[route[-1]])  # note: walk the prev pointers back to the source
    return [dist[dst], route[::-1]]
