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
```
like ──► INCR likes:post7#3      (r = random 0..7)
                                          read: MGET likes:post7#0..#7 → sum
```
Eight sub-counters accept 8× the write rate. Counting is additive, so the read side is just a
sum, and it can be cached for a second. Often you go further: count in memory per app server
and flush every second, so 50 000 likes/s become a few hundred `INCRBY` calls (that's
[pre-aggregation](#/topic/system-design/pre-aggregation)).

### Local cache, the read side
With 200 app servers and a 2 s local TTL, the shard owning a viral key sees at most
**200 / 2 = 100 reads/s** for it, however many million users ask. The price is bounded
staleness, which is fine for a like count and not fine for a stock level at checkout.

The trace below routes 12 requests round-robin over 3 app servers, each with its own short-lived
copy. Count how many requests actually reach the shard.

### Choosing
- Mostly **reads** of a value that can lag a second → local cache, plus coalescing on miss.
- Mostly **writes** that are commutative (counts, sums, set adds) → split into sub-keys.
- Writes that must be **ordered or exact** (the current high bid) → you can't split. Serialise
  them through one partition and make that single path fast, or shrink what each write does.
- Make it **adaptive**: only split or locally cache keys that the detector flags, so that the
  millions of cold keys don't pay N-way reads.
