## Writes and staleness: the hard part

As soon as data can change, the cache and the database can disagree. There are four main ways
to handle a write:

| strategy | how a write flows | write latency | staleness | data-loss risk |
|---|---|---|---|---|
| **cache-aside + invalidate** | write DB, then **delete** the key | DB only | small race window | none |
| **write-through** | write cache **and** DB synchronously | cache + DB | none for written keys | none |
| **write-behind (write-back)** | write cache, flush to DB later | cache only | none in cache | unflushed writes |
| **write-around** | write DB only, let the TTL expire the copy | DB only | until TTL | none |

### Write-through

Its tabs compare it with delete-on-write, and show a failed database write and the cost of caching every write.

```figure
write-through
```

> [!PROS]
> - A read right after a write sees the new value.
> - Simple mental model: the cache mirrors the database for every written key.

> [!CONS]
> - Every write pays two round trips.
> - Caches data nobody may ever read. Pair it with a TTL so cold keys age out.

### Write-behind

```figure
write-behind
```

> [!PROS]
> - Writes at memory speed, and many writes to one key collapse into one database update.
> - Smooths write bursts the database couldn't take directly.

> [!CONS]
> - The cache is briefly the only copy: a crash loses everything not yet flushed.
> - Harder to reason about. Other readers of the database see old data until the flush.

> [!PITFALL] Write-behind for money
> Using write-behind for orders, payments or stock without saying what happens on a cache crash
> is a red flag. It's for counters, view counts and other data you can lose or recompute.

### Cache-aside writes: delete, don't update

The default pairs cache-aside reads with **delete-on-write**: commit to the database, then
`DEL` the key so the next read loads fresh data. Why not `SET` the new value instead? Because
two writers can finish in the opposite order:

The tabs show that delete-on-write has its own rarer race, what happens when the DEL is lost, and invalidation driven by CDC.

```figure
update-race
```

A delete is safe whichever order it lands in. The worst case is one extra miss.

The trace below runs cache-aside **without** invalidation (`invalidate = false`). Reads after a
write keep returning the old cached value, and `stale` counts them. Try to predict the count
before stepping. With invalidation on, the same operations give 0 stale reads.
