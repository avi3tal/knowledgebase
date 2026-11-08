# Kafka

> Technology · Ideas: partitioned log, keys and ordering, offsets, consumer groups, replay

Kafka is a **distributed, replicated, append-only log**. Read
[message queues](#/learn/system-design/message-queues) first. Kafka is the "log" column of that
lesson's table, built to run at very high volume.

A **topic** (say `orders`) is split into **partitions**. Each partition is an ordered file that
only grows at the tail. Every record gets an **offset**, its position in that partition, and the
offset never changes. Brokers keep records for a **retention period** (7 days by default) whether
anyone has read them or not.

Its tabs show a consumer dying, a hot partition from a skewed key, and scaling with more consumers versus more partitions.

```figure
partitions-groups
```

**Producers** choose the partition by hashing the record's **key**: `partition = hash(key) % N`.
All events for `order 17` land in p0, in the order they were written. That's the only ordering
guarantee Kafka gives: **per partition, not per topic**. With no key, records are spread across
partitions for balance, and order means nothing.

**Consumers** pull. A consumer **group** splits the partitions among its members, so each
partition has exactly one reader in that group, and records the **committed offset** it has
finished. A different group (analytics, search indexing, an audit job) reads the same log
independently, and adding a group costs the producers nothing.

```figure
offsets-replay
```

> [!PROS]
> - Very high throughput from sequential appends, batching and compression.
> - Many independent readers and **replay** for the price of one write.
> - Per-key ordering that scales out with the partition count.

> [!CONS]
> - No per-message ack, retry, delay or priority. A slow or failing record holds up its whole
>   partition.
> - Ordering only within a partition, and the partition count is hard to change later.
> - Real operational weight: brokers, replication, rebalances, retention sizing.

> [!NUMBERS] Rough numbers to have in mind
> - One broker sustains **hundreds of MB/s** of writes. A cluster handles **millions of
>   messages/s**.
> - End-to-end latency is typically **5–50 ms**. It's a throughput system, not a
>   sub-millisecond RPC.
> - Default max record size is about **1 MB**. Put large blobs in object storage and send a
>   pointer.
> - Parallelism per group is capped at the **partition count**:
>   `partitions ≥ peak throughput ÷ per-consumer throughput`, e.g. 100 MB/s ÷ 10 MB/s = **10**,
>   often provisioned at 2–3× that for growth.

The trace below hashes 7 events into 3 partitions. Watch `u1`'s events always land in the same
row, in order, while `u4` happens to share its partition.
