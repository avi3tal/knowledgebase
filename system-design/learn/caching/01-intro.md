# Caching

> Building block · Ideas: cache-aside, write-through / write-back, eviction, TTL, invalidation

A cache keeps a **copy** of data somewhere faster or closer than its source of truth. Usually
that's memory instead of disk, or a nearby box instead of a far-away database. It pays off when
reads **repeat**: the same product page, the same user profile, the same computed result.

> [!NUMBERS] Latency, roughly
> - Memory read in-process: **~100 ns**
> - SSD read: **~100 µs**
> - In-memory key-value store over the network: **~0.5 ms**
> - Database query: **5–50 ms**

## What a hit rate buys you

With hit rate `h`, the average read costs `h × t_cache + (1 − h) × t_db`, and the database sees
only the misses.

> [!NUMBERS] Worked example: 20 000 reads/s, 0.5 ms cache, 20 ms query
> - No cache: every read is 20 ms, and the database serves **20 000 queries/s**.
> - `h = 0.9`: average = 0.9 × 0.5 + 0.1 × 20 = **2.45 ms**; database load **2 000 queries/s**.
> - `h = 0.99`: average ≈ **0.7 ms**; database load **200 queries/s**.
> - Memory: a hot set of 1 M items × 2 KB ≈ **2 GB**, which fits on one node with room to spare.

Going from 90% to 99% hits cuts database load by another 10×. That's why the shape of the
traffic (how often the same keys repeat) matters more than the cache product.

## Where caches live

```figure
cache-layers
```

Each layer has its own trade-off. An in-process cache costs no network hop, but every server
has its own copy, and those copies drift apart. A shared cache is one consistent copy, but
costs a hop and has to be scaled itself.

## Cache-aside (lazy loading), the default

```python
def get(key):
    value = cache.get(key)
    if value is None:                  # miss
        value = db.read(key)
        cache.set(key, value, ttl=300)
    return value
```

The tabs replay it when the cache node dies, for keys that don't exist, and with read-through instead.

```figure
cache-aside-read
```

> [!PROS]
> - Only data that's actually read gets cached, so memory goes to the hot set.
> - If the cache dies, the app still works, only slower.

> [!CONS]
> - Every first read (and every read after an eviction) pays cache + database latency.
> - The application owns the invalidation logic, and it's easy to forget a write path.

## Eviction: the cache is smaller than the data

When it's full, something has to go.

| policy | evicts | good for | weak spot |
|---|---|---|---|
| **LRU** | the key untouched for longest | most workloads: recent = hot | one big scan flushes the hot set |
| **LFU** | the key used least often | stable popularity (top products) | yesterday's star lingers |
| **FIFO** | the oldest insert | simplicity | ignores popularity entirely |
| **TTL** | anything past its age | bounding staleness | not a size policy on its own |

> [!INTERVIEW] What to say
> "Cache-aside in a shared in-memory store, LRU eviction, a TTL on every entry. I'll size it
> from the hot set: about a million items at 2 KB, so 2 GB plus headroom."

Step through an LRU cache of size 3 below. `order` runs from least to most recently used, and a
hit moves its key to the end.
