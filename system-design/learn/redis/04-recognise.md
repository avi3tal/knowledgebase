## How to recognise you need it

**Strong signals:**
- A **hot, small, mutable** piece of state read or updated on every request: counters, rate-limit
  buckets, sessions, "who is online".
- You need a **ranking or a time-ordered set** updated in real time: leaderboards, a waiting
  room in arrival order, "top 10 trending".
- Ephemeral state that should **vanish by itself**: presence heartbeats, short holds, OTP codes.
- Latency budget of a few ms for lookups the database can't meet, with data that fits in RAM.
- Many app servers must share the same counter or set, so an in-process map won't do.

**Look-alikes, and why they're different:**
- **[Caching](#/learn/system-design/caching)** is the *pattern* (a copy in front of a source of
  truth). Redis is one *tool* for it, and it's also used for things that aren't caches at all:
  counters, queues, rankings. If the question is "how do we cut read latency", answer with
  caching first, then name the store.
- **[DynamoDB](#/topic/system-design/dynamodb)** is a durable, disk-backed key-value store that
  scales to terabytes with single-digit-ms latency. Pick it when the data is the source of truth
  and too big for RAM. Redis wins on sub-ms latency and rich structures, not on durability.
- **[Kafka](#/topic/system-design/kafka)** keeps a durable, replayable log for days. Redis pub/sub
  is fire-and-forget: a subscriber that's offline misses the message.
- **[PostgreSQL](#/topic/system-design/postgresql)** gives transactions, constraints and ad-hoc
  queries over durable data. Redis has no joins, no secondary indexes and weak durability.

> [!PITFALL] Interview pitfalls
> - Using Redis as the only copy of money, orders or anything you can't rebuild, without
>   saying which persistence mode and what is lost on failover.
> - Forgetting **memory sizing**: keys × bytes per key, plus about 2× headroom.
> - Huge values or unbounded lists (`LPUSH` with no `LTRIM`); big keys block the single thread.
> - Assuming multi-key operations work across a cluster; they need a shared hash tag.
> - Saying "Redis lock" and stopping there: give the TTL and what happens if the holder pauses.

**In our problems:**
- **url-shortener:** the read-through cache in front of the link store on the redirect path.
- **rate-limiter-design:** the shared, sharded home of per-client counters with TTLs.
- **chat-system:** a registry of which gateway each device is connected to, kept alive by TTL.
- **live-comments:** recent comments per stream and the pub/sub channel between servers.
- **ticketmaster:** a sorted set as an arrival-ordered waiting room, plus page caches.
- **uber:** a geo set of moving driver positions, overwritten every few seconds.
