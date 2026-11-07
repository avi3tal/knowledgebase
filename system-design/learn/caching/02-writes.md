## Writes and staleness: the hard part

As soon as data can change, the cache and the database can disagree. You have four main
options:

| strategy | how a write flows | pros | cons |
|---|---|---|---|
| **cache-aside + invalidate** | write DB, then **delete** the cache key | simple; cache only holds read data | small race window; next read is a miss |
| **write-through** | write cache **and** DB synchronously | cache always fresh for written keys | slower writes; caches data nobody reads |
| **write-back (write-behind)** | write cache, flush to DB later | very fast writes, batching | data loss if the cache dies before flush |
| **write-around** | write DB only, let TTL expire the cache | no cache churn for write-once data | reads see old data until TTL |

Prefer **delete** over **update** on write. Two concurrent writers updating the cache can
leave it holding the older value forever, while a delete just forces a fresh load.

The trace below runs cache-aside **without** invalidation (`invalidate = false`). Reads after a
write keep returning the old cached value, and `stale` counts them. Try to predict the count
before stepping. With invalidation on, the same operations give 0 stale reads.

## TTL as a safety net
Even with invalidation, give every entry a TTL. It bounds how long any missed invalidation or
race can serve wrong data. Choose the TTL from **how stale the product can tolerate**, not
from memory size: seconds for prices, hours for avatars.

## Failure modes to name in an interview
- **Thundering herd / cache stampede:** a hot key expires and 10 000 requests miss at the same
  instant and all query the database. Fixes: a per-key lock so one request recomputes while the
  rest wait, serving stale-while-revalidate, and jittered TTLs.
- **Hot key:** one key gets so much traffic that its single cache shard melts. Fixes: replicate
  that key across shards (`key#1..key#n`) or cache it in-process too.
- **Cold start:** a new or flushed cache sends everything to the database. Warm it up first.
- **Cache penetration:** lookups for keys that **don't exist** always miss. Cache the
  negative result briefly, or check a Bloom filter first.
