# Hot Keys and Sharded Counters

> Pattern · Ideas: skew, key splitting (salting), local caching, request coalescing, sharded counters

[Sharding](#/learn/system-design/sharding) spreads **keys** across machines. It assumes the load
per key is roughly even. Real traffic is not: popularity follows a power law, and on a big day
one key (a celebrity's profile, a viral video, the world-cup final's comment stream, one ad
during a live match) can get more traffic than everything else on its shard put together.

A **hot key** is a single key whose request rate is more than the one node that owns it can
serve. Adding shards doesn't help, because a key always maps to exactly one place.

```figure
hot-shard
```

## Why it hurts, with numbers

> [!NUMBERS] One key against one node
> - A Redis or Memcached node does about **100 000 simple ops/s**. A viral item at **500 000
>   reads/s** needs five nodes' worth of capacity for a single key.
> - A database row updated in place (`views = views + 1`) manages a few **hundred to a few
>   thousand writes/s** before row-lock contention takes over. One viral counter is enough.
> - Rule of thumb: if `peak rate of one key ÷ capacity of one node > ~0.3`, plan a mitigation
>   for that key, because it leaves no headroom for the shard's other keys.

When the hot shard saturates, everything else on that shard slows down too: the hot key's
neighbours suffer for its popularity. And the failure spreads: clients time out, retry, and
pile even more load onto the same node.

> [!PITFALL] "Just add shards"
> Going from 4 to 8 shards halves the load from the *other* keys on the hot shard, but the hot
> key's own rate is unchanged. Consistent hashing and virtual nodes balance **keys**, not
> **traffic per key**.

## Spotting it

Watch **per-shard** load, not the average. One shard at 95% CPU while the others sit at 20% is
the signature. Find the culprit with per-key request sampling, a top-k sketch (count-min) on the
proxy, or the store's own hot-key report.

> [!INTERVIEW] Say it before you're asked
> In the deep dive, name which keys can go viral (celebrities, live events, flash sales,
> trending posts), estimate the rate for **one** of them, and compare it with one node's
> capacity. That number decides whether you need anything in the next section.

The trace below hashes 12 requests onto 4 shards. Eight of them are for `video:42`. It runs
with `split = 1` (no mitigation): watch shard 0's count run away.
