## How to recognise you need it

**Strong signals:**
- **Skewed popularity** in the requirements: celebrities with 50 M followers, a live final, a
  flash sale, "one ad gets 10% of all clicks".
- A **single counter or row** updated by everyone: view counts, likes, a global sequence, the
  stock of one item.
- The back-of-envelope number for **one key** exceeds what one node does (~100k ops/s for an
  in-memory store, a few thousand for a hot database row).
- Monitoring shows **one shard** saturated while the average looks healthy.

**Look-alikes, and why they're different:**
- **[Sharding](#/learn/system-design/sharding)** spreads many keys over many nodes. It's the
  precondition for this problem, not the fix: one key still maps to one shard.
- **[Consistent hashing](#/learn/system-design/consistent-hashing)** decides which node owns a key
  and limits reshuffling when nodes change. Virtual nodes even out *many keys*, but they can't
  divide a single key's traffic.
- **[Rate limiting](#/learn/system-design/rate-limiting)** rejects a *client* sending too much.
  A hot key is usually millions of legitimate clients wanting the *same item*. You must serve
  them, not drop them.
- **[Caching](#/learn/system-design/caching)** puts a fast copy in front of a slow store. Hot keys
  is what happens when the cache itself has one overloaded node. A local cache is one fix, but
  "add a cache" alone doesn't answer it.
- **[Fan-out](#/topic/system-design/fan-out)** handles one *write* that must reach many
  *readers' feeds* (the celebrity post). That's a write-amplification problem, not a single
  overloaded key.

**Interview pitfalls:**
- Splitting **every** key N ways: cold keys now pay N reads for nothing. Split only the hot ones.
- Splitting a value that isn't commutative (latest high bid, seat holder). The sub-keys disagree.
- Forgetting the readers: whoever reads a split counter must know N and merge.
- Local caches with no TTL. Hot values change too, and each server drifts on its own.
- Not saying how hot keys are **detected**, or assuming you'll know them in advance.

**In our problems:**
- **url-shortener:** a viral link turns one redirect key into most of the cache traffic.
- **live-comments:** one stream with millions of viewers is the hot key of the whole system.
- **news-feed:** a celebrity's posts are read by tens of millions of feeds at once.
- **youtube:** viral videos stress the caches and the per-video view counters.
- **online-auction:** a popular auction concentrates bids and watchers on one item.
- **ad-click-aggregator:** a viral ad's click count overloads a single counting partition.
