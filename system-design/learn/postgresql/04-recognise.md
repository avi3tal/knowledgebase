## How to recognise you need it

**Strong signals:**
- **Money or scarce stock:** balances, payments, seats, inventory, bids. Duplicates or lost
  updates are bugs you'd have to refund.
- An operation must change **several rows together** (order + order lines + stock).
- **Invariants** the data must never break: unique usernames, `qty >= 0`, one booking per seat.
- **Relational queries:** joins, filters on several columns, ad-hoc admin and support queries.
- Moderate scale: up to ~10k writes/s and a few TB, or a dataset that shards cleanly by one key.

**Anti-signals:**
- Massive **append-only write** volume (100k+ writes/s of events, messages, metrics) with
  simple key-based reads. A single primary's WAL is the bottleneck.
- A pure key → value access pattern at huge scale with no joins or cross-row transactions.
- Full-text relevance search, or analytical scans over billions of rows.

**Look-alikes, and why they're different:**
- **[Cassandra](#/topic/system-design/cassandra)** spreads writes over every node with no
  single primary. It's built for huge write rates and time-ordered partitions (chat history,
  feeds), but gives up joins and multi-row transactions.
- **[DynamoDB](#/topic/system-design/dynamodb)** is a managed key-value / document store that
  scales almost without limit if you know the access patterns up front. It has conditional
  writes and limited transactions, but no ad-hoc queries.
- **[Redis](#/topic/system-design/redis)** is in-memory and sub-millisecond: counters, caches,
  leaderboards. It's not the durable source of truth for money.
- **[Time-series](#/topic/system-design/time-series-db)** and
  **[OLAP stores](#/topic/system-design/olap-stores)** are columnar and made for aggregating
  billions of points. Postgres row storage scans them slowly.

> [!INTERVIEW] How to defend choosing Postgres
> Lead with the estimate: "2k writes/s and 500 GB fits one primary with headroom." Name the
> transaction ("insert the order and decrement stock together"), the constraint that guards the
> invariant (`CHECK (stock >= 0)`), and the index each hot query uses. Then say what you'd do at
> 10× (replicas for reads, shard by `merchant_id` for writes).

> [!PITFALL] Interview pitfalls
> - "Postgres doesn't scale" said by reflex: do the
>   [back-of-envelope](#/learn/system-design/back-of-envelope) first. Most designs fit one
>   primary plus replicas.
> - Choosing it without naming the **index** each hot query uses.
> - Read-modify-write without a lock, a version column or a constraint, which means lost updates.
> - [Sharding](#/learn/system-design/sharding) by a key that makes the common transaction
>   cross-shard.
> - Reading from a replica right after a write (read-your-writes) without saying how lag is handled.

**In our problems:**
- **rate-limiter-design:** the small, audited home of the limit rules, not the hot counters.
- **job-scheduler:** durable job definitions, with an index that finds the jobs due next.
- **local-delivery:** per-warehouse stock and orders updated together in one transaction.
- **ticketmaster:** seat state and bookings, where the database has to stop double-selling.
- **payment-system:** payments and an append-only ledger, where correctness beats raw speed.
- **online-auction:** bids and the current high bid under heavy contention at closing time.
