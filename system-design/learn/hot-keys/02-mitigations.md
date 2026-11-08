## Four ways to cool a hot key

Run the same 12 requests with `split = 4` and the sub-keys `video:42#0..#3` land on four
different shards: the load becomes 3/3/3/3 instead of 9/1/1/1.

| technique | works for | how | cost |
|---|---|---|---|
| **key splitting (salting)** | writes: counters, likes, views | write to `key#r`, r random in 0..N-1; read all N and sum | reads fan out N ways; N must be known to readers |
| **read replicas of the key** | reads | store copies under `key#0..#N`, read a random one | every write updates N copies |
| **local (in-process) cache** | reads | each app server keeps the hot value for 1–5 s | up to TTL stale; memory per server |
| **request coalescing** | reads on a miss | one in-flight fetch per key, others wait for it | a little latency for the waiters |

### Sharded counters, the write side

The tabs show a sub-key's shard dying and the batch-in-memory alternative.

```figure
split-counter
```

Counting is additive, so the read side is just a sum, and it can be cached for a second.

> [!NUMBERS] Sizing N
> `N = ceil(peak writes/s ÷ safe writes/s per node)`. 120 000 reactions/s at a safe 25 000/s per
> node → N = 5. Round up to 8 for headroom. Reads now cost one `MGET` of 8 keys.

Often you go further: count in memory per app server and flush every second, so 50 000 reactions/s
from 200 servers become 200 `INCRBY` calls per second (that's
[pre-aggregation](#/topic/system-design/pre-aggregation)).

> [!PROS]
> - Write capacity grows linearly with N.
> - No coordination: any writer can pick any sub-key.

> [!CONS]
> - Only for **commutative** updates (add, count, set-add). A "current value" can't be split.
> - Every reader must know N and merge, and changing N needs care.

### Local cache, the read side

The tabs compare it with key splitting, and show stale values and a shard outage.

```figure
local-cache
```

> [!PROS]
> - The shard's load is capped at `servers ÷ TTL`, independent of the audience size.
> - Reads are served from process memory in microseconds.

> [!CONS]
> - Up to one TTL of staleness, different on every server. Fine for a like count, not for a
>   stock level at checkout.
> - Memory on every server, so keep it to the few keys that are actually hot.

The trace below routes 12 requests round-robin over 3 app servers, each with its own short-lived
copy. Count how many requests actually reach the shard.
