## How to recognise you need it

**Strong signals:**
- **Write-heavy** traffic beyond one node: 50k–1M writes/s of messages, events, logs or activity.
- Access is always **by a known key, then a range**: "messages of conversation X after seq 900",
  "a user's last 20 notifications".
- Data is naturally **time-ordered** and append-mostly, often with a TTL ("keep 30 days").
- Multi-region, always-writable, no single leader to fail over. Eventual consistency is acceptable.
- Data size measured in tens of TB, growing steadily.

**Anti-signals:**
- You need joins, ad-hoc filters or aggregates over arbitrary columns → that's
  [PostgreSQL](#/topic/system-design/postgresql) (or an [OLAP store](#/topic/system-design/olap-stores)
  for analytics).
- Money moves or uniqueness must hold across rows (balances, seat booking) → you need ACID
  transactions, not last write wins.
- Small data with a few thousand writes per second. One Postgres node does that with far less
  operational effort.

**Look-alikes, and why they're different:**
- **[DynamoDB](#/topic/system-design/dynamodb)** has the same partition key + sort key model, but
  it's fully managed and billed per request, with single-region strong reads and transactions. You
  pick Cassandra when you need to self-host, run multi-cloud, or want cheaper sustained heavy writes.
- **[Time-series DB](#/topic/system-design/time-series-db)** is specialised for numeric samples per
  series: compression to ~1–2 bytes per point, downsampling, range math. Cassandra stores arbitrary
  rows and leaves all of that to you.
- **[Redis](#/topic/system-design/redis)** is in memory, with sub-millisecond latency and limited
  durability. Cassandra is disk-backed and durable, at 1–10 ms.

> [!INTERVIEW] How to pitch Cassandra
> "Device readings are write-heavy (200k/s) and always read by device, newest first, so I'd use
> Cassandra with `PRIMARY KEY ((device_id, day), ts)`. The day bucket bounds each partition.
> Writes and reads at QUORUM with RF = 3, so R + W > N and we survive one node down."

> [!PITFALL] Interview pitfalls
> - Choosing the partition key without saying what bounds its size. Unbounded partitions and hot
>   partitions are the two classic failures.
> - Writing a query that has no partition key in it (a scan of the cluster).
> - Claiming strong consistency without stating R + W > N, or forgetting that clock skew breaks
>   last write wins.
> - Using Cassandra as a queue: deletes write **tombstones**, and reading past millions of them is slow.

**In our problems:**
- **notification-system:** the delivery log, written once per send and expired by TTL.
- **news-feed:** post storage that must take a write-heavy, horizontally growing load.
- **instagram:** post metadata, likes and the follow graph as per-user range scans.
- **chat-system:** message history partitioned by conversation and ordered within it.
- **live-comments:** durable comment replay, with partitions bucketed by time to stay bounded.
- **key-value-store:** you build the same machinery yourself: ring, replicas, quorums, repair.
