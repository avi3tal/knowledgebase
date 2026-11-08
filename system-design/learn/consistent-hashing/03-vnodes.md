## Virtual nodes

The example ring happens to be fair: A owns (85, 20] after wrapping, B (20, 50], C (50, 85], so
35 / 30 / 35. Real hashes aren't so kind. With one random point per server it's common for one
server to own 2–3× another's share, and after D joined, D's arc is only 15 positions wide while
B's is 30. And when a server dies, **all** its keys land
on one neighbour, which may then tip over too.

The fix is to hash each physical server onto the ring many times (**virtual nodes**, typically
100–200 each): `hash("A#1")`, `hash("A#2")`, … Each server now owns many small arcs scattered
around the circle.

```figure
vnode-failure
```

> [!PROS]
> - Arc sizes average out: with ~150 points per server, shares are typically within a few
>   percent of even.
> - A failed server's load spreads over **many** survivors instead of one.
> - Weighting for free: a machine with twice the RAM gets twice the virtual nodes.

> [!CONS]
> - The ring has N·V entries to store and gossip (10 servers × 150 = 1 500, still tiny).
> - A join or leave touches many small ranges, so data moves from many peers at once.

## Lookup and replication

Keep the virtual-node positions in a sorted array. A lookup is a binary search:

```figure
ring-lookup-flow
```

To keep R copies, keep walking clockwise until you have **R distinct physical servers**,
skipping extra virtual nodes of servers you already picked. That ordered list is the key's
*preference list*, the way leaderless key-value stores choose replicas.

> [!INTERVIEW] What to say in 30 seconds
> "`hash % N` remaps about N/(N+1) of the keys whenever the cluster changes size, which is a cache
> stampede or a full data reshuffle. I'll put servers and keys on a hash ring so a key goes to
> the next server clockwise: adding a node moves only ~K/N keys from its neighbour. I'll use
> ~100+ virtual nodes per server for even load and to spread a failure, and walk the ring to the
> next R distinct servers for replicas."
