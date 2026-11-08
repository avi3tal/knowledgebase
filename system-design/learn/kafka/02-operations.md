## Consumer groups, commits and rebalances

A consumer loops: **poll** a batch from its committed offset, process it, **commit** the new
offset. When the commit happens decides the delivery guarantee:
- Commit **after** processing → at-least-once. A crash between the two replays the batch.
- Commit **before** processing → at-most-once. A crash loses the batch.

When a member joins, leaves or misses heartbeats (about 10–45 s of session timeout), the group
**rebalances**: partitions are reassigned and the new owner resumes from the last committed
offset. Two consequences:
- Records processed but not committed are processed **again**, so consumers must be idempotent.
- Consumption pauses for affected partitions during the rebalance (seconds). Frequent deploys or
  slow handlers that exceed `max.poll.interval` cause rebalance storms.

```figure
rebalance-crash
```

| commit | crash between process and commit | guarantee | consumer must be |
|---|---|---|---|
| before processing | batch is skipped | at-most-once | nothing special, but data is lost |
| after processing | batch is processed again | at-least-once | idempotent (dedupe key, upsert) |
| in a transaction with the output topic | output and offset commit together | exactly-once (Kafka to Kafka only) | inside Kafka; external side effects still need idempotency |

## Replication and durability

Each partition has a **leader** and followers on other brokers (replication factor 3 is the
usual choice). Followers that are caught up form the **in-sync replica set (ISR)**.

```figure
acks-all
```

- `acks=1`: fast, but if the leader dies before followers copy the record, it's lost.
- `acks=all` + `min.insync.replicas=2`: survives one broker loss without losing data. It costs
  a few ms more per write.
- Idempotent producers (sequence numbers per partition) stop retries from writing duplicates.
  Transactions extend that to "read, process, write" between topics.

## Retention, compaction and sizing
- **Time/size retention:** delete segments older than N days or beyond N GB. Replay works only
  inside this window, so size it for the longest reprocess you need.
- **Log compaction:** keep only the latest record per key. The topic becomes a changelog you can
  rebuild state from (user profiles, CDC tables).
- **Partitions are hard to change later:** adding some remaps `hash(key) % N`, which breaks
  per-key ordering across the change. Over-provision up front, but not without limit: every partition
  costs memory, file handles and failover time.
- **Hot keys:** one viral key means one hot partition, and one consumer can't keep up. Salt the
  key, or split that key's traffic out.

> [!NUMBERS] Sizing the disk
> - Formula: `disk = write rate × retention × replication factor`.
> - 50 MB/s × 604 800 s (7 days) × 3 ≈ **90 TB** across the cluster.
> - Over 12 brokers that's about 7.5 TB each, plus headroom: a broker with a full disk stops
>   accepting writes.

In the trace below, `c2` processes its batch from p1, crashes before committing, and `c1` takes
over p1 from offset 0. Two records end up processed twice.
