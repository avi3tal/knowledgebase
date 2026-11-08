## Architecture at a glance

Estimates only matter because they pick the boxes. Here is a photo-sharing app (10 M daily
users) with every component labelled by the number that put it there. Play the figure and read
the sub-labels, then switch the tabs: the evening peak, the cache going down, and one photo going
viral.

```figure
system-overview
```

### Zoom in: where the numbers force a component

Follow the peak through the read path. Watch each sub-label: whenever a number crosses a
single-node limit (a NIC, a server, a database), a new box appears. The tabs change one input
each: a lower hit rate, no CDN at all, and 100× the users.

```figure
read-funnel
```

### How it scales

Run the same estimate at 100k, 1 M, 10 M and 100 M users. Each 10× breaks a different number
first: bandwidth (CDN), then database reads (cache and replicas), then data size (sharding).

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Which load to size for | average · peak · peak + headroom | **Peak (3×) plus ~30% headroom** | Systems fall over at 8 pm, not on the daily average |
| Where photo bytes live | database BLOBs · file servers · object store | **Object store** | 5.5 PB is far past any database; object stores are cheap and durable |
| How to serve bytes | origin servers · CDN | **CDN** | 23 Gbps average, ~70 Gbps at peak, is more than a few NICs and close to users |
| Metadata reads | replicas only · cache + replicas | **Cache + replicas** | 17 400 reads/s at peak; a 95% hit rate leaves the DB under 1 000/s |
| When to shard metadata | now · when size or writes demand it | **Later** (at ~100 M users) | 23 writes/s and 3.6 TB fit one primary; sharding early costs complexity |
| Rounding | exact arithmetic · powers of ten | **1 day ≈ 1e5 s, round to 1–2 digits** | Factor-of-10 accuracy picks the same boxes and saves minutes |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Sizing for the average | quoting 5 800 reads/s instead of 17 400 | Read path saturates every evening | Always state the peak factor and size for it |
| Mixing bytes and rows | one storage number for photos and metadata | Wrong database choice, or a missed blob store | Estimate bytes and metadata separately |
| Hit-rate optimism | assuming 99% when real traffic gives 80% | Origin and DB get 4–20× the planned load | Quote estimates at two hit rates; keep replica headroom |
| Cold cache | cache restart or new region at peak | Every read hits the database | Warm caches before cutover, keep a replica cache, shed load |
| Egress cost | CDN misses or no CDN | Bandwidth bill and origin overload | Long cache TTLs for immutable photos, origin shielding |
| Units slip | bytes vs bits, KB vs MB | An 8× or 1 000× error picks the wrong box | Write units on every line; bandwidth in bits = bytes × 8 |
