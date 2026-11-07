# Caching

> Building block · Ideas: cache-aside, write-through / write-back, eviction, TTL, invalidation

A cache keeps a **copy** of data somewhere faster or closer than its source of truth. Usually
that's memory instead of disk, or a nearby box instead of a far-away database. It pays off when
reads **repeat**: the same product page, the same user profile, the same computed result.

```
latency, roughly:   memory read ~100 ns   │  in-memory KV over network ~0.5 ms
                    SSD read ~100 µs      │  database query 5–50 ms
```

Serving 90% of reads from a 0.5 ms cache instead of a 20 ms query cuts both latency and
database load by about 10×.

## Where caches live
```
browser ─► CDN/edge ─► load balancer ─► app servers ─► [ shared cache ] ─► database
 (HTTP cache)  (static, media)          (in-process)    (in-memory KV)    (buffer pool)
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
The application talks to both the cache and the database. Only data that's actually read gets
cached, and if the cache dies the app still works, only slower.

## Eviction: the cache is smaller than the data
When it's full, something has to go. **LRU** (least recently used) evicts the key untouched for
the longest time, and suits most workloads where recent data is hot. **LFU** keeps keys that
are popular over a long period. **TTL** expires entries by age whatever their popularity.

Step through an LRU cache of size 3 below. `order` runs from least to most recently used, and a
hit moves its key to the end.
