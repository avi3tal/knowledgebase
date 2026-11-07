## How to recognise you need it

**Strong signals:**
- **Read-heavy** traffic: 10:1 to 1000:1 reads per write, with the same items read again and
  again (skewed popularity, the 80/20 rule).
- A latency target the database can't meet ("p99 under 20 ms").
- Expensive computation whose result is reused: rendered pages, aggregates, ML features,
  sessions.
- The data can tolerate being **slightly stale** for some time.

**Anti-signals:**
- Every read is unique (high-cardinality, long tail), so the hit rate will be poor.
- Strong consistency is mandatory on every read (balances, inventory at checkout). Read from
  the source of truth or design very careful invalidation.
- Write-heavy workloads: the cache churns and mostly adds staleness.

**Look-alikes, and why they're different:**
- **CDN** is a cache too, but at the **network edge** for static or public content (images,
  video, JS) shared by many users far from your data centre. Personalised or dynamic data
  usually goes in an application cache.
- **Replication** adds full read replicas of the database: complete, durable, still a database
  query. A cache is partial, volatile and much faster.
- **Rate limiting** caps how many requests a client may make. Caching makes each allowed
  request cheaper.
- **Sharding** splits **writes and storage** across machines. Caching doesn't help with write
  throughput.

**Interview pitfalls:**
- Saying "add a cache" without the read/write ratio, the expected hit rate, or what it costs
  in memory (back-of-envelope: hot set × object size).
- Not saying how entries get **invalidated** or how stale they may be.
- Ignoring stampedes and hot keys on very popular items.
- Treating the cache as the source of truth (write-back) without saying what happens when it
  crashes.
