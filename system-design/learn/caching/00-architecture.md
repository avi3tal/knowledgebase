## Architecture at a glance

Before the patterns, see the system an architect would draw. This is an online shop's product
page: browser cache, CDN, a local cache in each service pod, a shared cache cluster and the catalog
database, plus an invalidation path driven by database change events. Play the figure, then switch
the tabs: a flash sale, a cache node dying, and a schema change rolled out without a flush.

```figure
system-overview
```

### Zoom in: the read path

One read walks inward until something answers. Watch where the cost jumps (memory, then network,
then database) and what stops a crowd of misses from reaching the database together. Try the
tabs for a full miss, many misses at once, and the cache timing out.

```figure
read-path
```

### Zoom in: invalidation

Reads are the easy half; the hard half is removing stale copies after a write. Follow the price
change from the database log to every tier. The tabs show a removal that gets lost and the simpler
TTL-only alternative.

```figure
invalidation
```

### How it scales

The design changes as traffic grows: straight to the database, then one cache node, then a sharded
cache cluster, then several tiers in several regions.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Read pattern | cache-aside · read-through · write-through | **Cache-aside** | The app controls what is cached, and a cache outage degrades to slower reads instead of errors |
| Invalidation | TTL only · delete on write in the app · change events (CDC) | **Change events + TTL as a backstop** | Every committed write produces an event, even if the writer crashes; the TTL limits damage from a missed one |
| What to cache | DB rows · product objects · whole pages | **Product object per id**, page API at the CDN | One key per product is easy to invalidate; the CDN copy is short-lived |
| Local cache in pods | none · short-TTL in-process LRU | **5 s LRU for the top products** | Removes the network hop for the hottest items; 5 s of staleness is acceptable on a product page |
| Price and stock at checkout | trust the cache · re-read the DB | **Re-read the DB** | A stale price on the page is a nuisance; a stale price on an order is a bug |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Stampede | a popular key expires | Hundreds of identical DB reads at once | Fill lock or request coalescing, TTL jitter |
| Missed invalidation | DEL or purge lost, invalidator down | Stale price shown until the TTL | Commit the event offset only after success, retries, a bounded TTL |
| Cache node loss | node crash or restart | Its keys all miss; DB load spikes | Replicas, a cap on concurrent DB reads, serve stale local copies |
| Cold start | new region or a flushed cluster | DB overloaded while the cache is empty | Warm the top keys first, ramp traffic gradually |
| Hot key | one product goes viral | The node that owns it saturates | Local cache in pods, CDN for the page API, key copies |
