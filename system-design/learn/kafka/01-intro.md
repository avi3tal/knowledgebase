# Kafka

> Technology · Ideas: partitioned log, keys and ordering, offsets, consumer groups, replay

Kafka is a **distributed, replicated, append-only log**. Read
[message queues](#/learn/system-design/message-queues) first. Kafka is the "log" column of that
lesson's table, built to run at very high volume.

A **topic** (say `orders`) is split into **partitions**. Each partition is an ordered file that
only grows at the tail. Every record gets an **offset**, its position in that partition, and the
offset never changes. Brokers keep records for a **retention period** (7 days by default) whether
anyone has read them or not.

```
topic "orders", 3 partitions                  consumer group "billing"
                                              (one owner per partition)
p0 │ o:17 │ o:42 │ o:17 │ o:99 │ ◄─ append      c1 ◄── p0, p1   committed: p0=3, p1=1
p1 │ o:08 │ o:23 │               ◄─ append      c2 ◄── p2       committed: p2=0
p2 │ o:55 │ o:61 │ o:55 │        ◄─ append
     0      1      2      3   ← offsets       group "analytics" reads the SAME records
                                              with its own offsets
```

**Producers** choose the partition by hashing the record's **key**: `partition = hash(key) % N`.
All events for `order 17` land in p0, in the order they were written. That's the only ordering
guarantee Kafka gives: **per partition, not per topic**. With no key, records are spread across
partitions for balance, and order means nothing.

**Consumers** pull. A consumer **group** splits the partitions among its members, so each
partition has exactly one reader in that group, and records the **committed offset** it has
finished. A different group (analytics, search indexing, an audit job) reads the same log
independently, and adding a group costs the producers nothing.

Rough numbers to have in mind:
- One broker sustains **hundreds of MB/s** of writes, because appends are sequential and records
  are batched and compressed. A cluster handles **millions of messages/s**.
- End-to-end latency is typically **5–50 ms**. It's a throughput system, not a sub-millisecond RPC.
- Default max record size is about **1 MB**. Put large blobs in object storage and send a pointer.
- Parallelism per group is capped at the **partition count**. Choose it for peak consumer
  throughput, e.g. 100 MB/s ÷ 10 MB/s per consumer → at least 10 partitions, often 2–3× that.

The trace below hashes 7 events into 3 partitions. Watch `u1`'s events always land in the same
row, in order, while `u4` happens to share its partition.
