## Architecture at a glance

Before the techniques, see the system an architect would draw. This is a flash-sale shop: a
limited item drops at a fixed time, and most of the traffic asks for the same item over a cache and
database that are sharded by item. Watch where sharding stops helping and what each mitigation
takes off the hot shard. Play the figure, then switch the tabs: an unplanned viral item, the hot
shard saturating, and pre-warming before a planned drop.

```figure
system-overview
```

### Zoom in: detection

You can only protect a key once you know it is hot. Follow how sampled counts from every pod turn
into a shared hot list. The tabs show a key cooling down and the detector itself failing.

```figure
hot-detection
```

### Zoom in: serving a hot key

Once a key is on the list, each pod handles its reads differently. Watch the three layers: the
local copy, one refill per pod, and copies of the key spread over shards. Try the tabs for a burst
of misses, an unavailable copy, and a key that isn't on the list yet.

```figure
hot-read-path
```

### How it scales

The design changes as the hot spots get bigger and less predictable: one hot shard, then
replicas, then hand-configured hot keys, then adaptive detection and mitigation.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| How to find hot keys | static list · shard CPU alerts · sampled top-K | **Sampled top-K, plus a static list for planned events** | Sampling finds surprises in seconds; the list covers drops you know about in advance |
| Read side | replicas · local copy in pods · copies of the key | **Local copy for 1 s, refilled from key copies** | Load on the cache becomes per pod, not per request, and refills don't land on one shard |
| Misses | let every request refill · coalesce | **Coalesce per pod** | When a copy expires, one call goes out instead of hundreds |
| Write side (stock) | one counter · split counter · queue of reservations | **Split counter in 8 parts** | Writes spread over shards and no part can go below zero, so nothing is oversold |
| Staleness | strict · bounded | **Bounded at about 1 s for item data**, exact for stock | Shoppers don't notice a 1 s old description; they notice an oversold item |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Detection lag | a key goes viral with no warning | Its shard saturates for several seconds | Short sampling windows, a per-pod local top-K |
| Collateral damage | the hot shard slows down | Unrelated keys on the same shard fail too | Circuit breaker per shard, stale local copies, a concurrency cap on DB fallback |
| Stale data | local copies and replicas | Users see a slightly old value | Keep the lifetime short; read exact values (stock, price at checkout) from the source |
| False "sold out" | some stock parts reach zero first | Shoppers are turned away while stock remains | Try other parts before refusing, rebalance parts near the end |
| List flapping | traffic hovers near the threshold | Keys go in and out of local caches | Separate add and remove thresholds, entries with expiry |
