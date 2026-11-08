## Algorithms

| algorithm | how it picks | state in the LB | best when | weak when |
|---|---|---|---|---|
| round robin | server `i % N` in turn | one counter | requests cost about the same | costs vary: slow requests pile up |
| weighted round robin | more turns for bigger machines | counter + weights | mixed instance sizes | same as round robin |
| least connections | fewest open requests | open count per server | durations vary (uploads, long polls) | many LB nodes each see only part of the load |
| power of two choices (P2C) | sample 2 at random, take the less loaded | load per server, can be stale | large pools, many LB nodes | tiny pools (no better than least connections) |
| hash (IP or key) | `hash(key)` picks the server | none | affinity: local caches, WebSocket rooms | hot keys; plain `mod N` reshuffles when N changes |

```figure
pick-algorithm
```

Power of two choices deserves a sentence in an interview: checking just **two** random servers
avoids the worst pile-ups almost as well as checking all of them, and it doesn't need a perfectly
fresh global view. That matters when ten LB nodes each make their own decisions.

> [!PITFALL]
> Hashing with `hash(key) % N` remaps almost every key when N changes from 10 to 11. If affinity
> matters, use consistent hashing so that only about 1/N of the keys move.

The two traces below replay the **same** request stream: one request per tick, three servers,
and every third request is slow (8 ticks) while the rest take 1 tick. Watch `active`, the open
connections per server.
