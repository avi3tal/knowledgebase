## Race: BFS against DFS on the same maze

The table above says BFS finds the **shortest** route and DFS only finds **a** route. Watch it
happen. The trace below runs DFS on the very same maze: a stack instead of a queue, plus a
`parent` dict that remembers where each cell was reached from, so we can see the route it found.

Then press **Start the race**: both searches move one expansion per tick. DFS dives down one
corridor and often expands fewer cells before it stumbles on the goal, but its route is longer.
BFS spreads in rings, so the first time it pops the goal the route is guaranteed to be the
shortest.
