# Hot Keys and Sharded Counters

> Pattern · Ideas: skew, key splitting (salting), local caching, request coalescing, sharded counters

[Sharding](#/learn/system-design/sharding) spreads **keys** across machines. It assumes the load
per key is roughly even. Real traffic is not: popularity follows a power law, and on a big day
one key (a celebrity's profile, a viral video, the world-cup final's comment stream, one ad
during a live match) can get more traffic than everything else on its shard put together.

A **hot key** is a single key whose request rate is more than the one node that owns it can
serve. Adding shards doesn't help, because a key always maps to exactly one place.

```
                 hash(key) % 4
1 000 000 req/s ──────────────► shard 0  ██████████████████████  (video:42 + its neighbours)
                                shard 1  ██
                                shard 2  ██
                                shard 3  ██
```

## Why it hurts, with numbers
- A Redis or Memcached node does about **100 000 simple ops/s**. A viral item at **500 000
  reads/s** needs five nodes' worth of capacity for a single key.
- A database row updated in place (`views = views + 1`) manages a few **hundred to a few thousand
  writes/s** before lock contention takes over. One viral counter is enough to cause it.
- When the hot shard saturates, everything else on that shard slows down too: the hot key's
  neighbours suffer for its popularity.

## Spotting it
Watch **per-shard** load, not the average. One shard at 95% CPU while the others sit at 20% is
the signature. Find the culprit with per-key request sampling, a top-k sketch on the proxy, or
the store's own hot-key report. In an interview, say up front which keys can go viral:
celebrities, live events, flash sales, trending posts.

The trace below hashes 12 requests onto 4 shards. Eight of them are for `video:42`. It runs
with `split = 1` (no mitigation): watch shard 0's count run away.
