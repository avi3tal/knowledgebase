# Solution: distributed message queue (Kafka)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
You are designing the infrastructure, not using it. The key idea is to treat a queue as a
**replicated, partitioned, append-only log**:
- writes become sequential appends;
- a reader's whole state becomes **one offset** per partition, so any number of applications can
  read and replay the same data;
- ordering, scale and durability are all handled **per partition**: one leader per partition,
  replicated to followers, with leaders elected by a small consensus group.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Producers publish keyed messages to named topics |
| F2 | Same key → read in produced order (no global order) |
| F3 | Consumer groups: each group gets every message; its members split the work |
| F4 | Resume after restart; rewind to an offset or time to replay |
| F5 | Retention per topic: time/size (7 days), or latest value per key (compaction) |
| N1 | ~1M msg/s (~1 GB/s) at peak; produce p99 < 10 ms, end-to-end < 100 ms |
| N2 | An acked message survives losing any broker or a zone |
| N3 | A failed broker's partitions get new leaders within seconds |
| N4 | Scales out by adding brokers and partitions |

**Assumptions:** ~1 KB messages, average 300k/s, ~3 consumer groups per message, ~2,000 topics,
brokers with 20 TB of disk and 10 Gbps NICs. **Out of scope:** cross-region mirroring, schema
registry, stream-processing APIs, delayed or priority messages.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| ingress at peak | 1M × 1 KB | **1 GB/s** |
| replicated writes | × 3 replicas | **3 GB/s** cluster-wide |
| consumer egress | × 3 groups | **~3 GB/s** (+2 GB/s replication fetch) |
| storage, 7 days | 300k × 1 KB × 7 d | **~180 TB** raw, **~540 TB** with 3 replicas |
| brokers | 540 TB / 20 TB × 1.5 headroom | **~40** |
| partitions for the busiest topics | 1 GB/s ÷ ~10 MB/s per partition | **~100+** |

What the numbers say: per broker it's ~75 MB/s in and ~125 MB/s out, which is fine for a 10 Gbps NIC
if IO is sequential. **Disk capacity sizes the cluster**, so retention policy is a cost decision.

## 3. API and data model
- `Produce(topic, [{key, value, headers}], acks, producer_id, sequence)` → `{partition, base_offset}`
  goes to the partition's leader. `producer_id` + `sequence` make retries idempotent.
- `Fetch(topic, partition, offset, max_bytes, max_wait_ms)` → record batches + high watermark. It
  long-polls, and returns only records the ISR has replicated.
- `JoinGroup` / `Heartbeat` / `CommitOffset(group, {partition: offset})` go to the group
  coordinator.
- `Metadata(topics)` → partition → leader, replicas and ISR. Clients connect straight to leaders, so
  there is no load balancer in the data path.

| entity | key and fields | where |
|---|---|---|
| partition log | per topic-partition: segment files `base_offset.log` + offset index + time index; records [offset, ts, key, value, headers] | each replica's local disk |
| committed offsets | (group, topic, partition) → offset | internal compacted topic `__consumer_offsets` |
| cluster metadata | topics, replicas, leader, ISR, leader epoch, brokers | controller quorum (Raft) |

## 4. Decompose: the parts
Four sub-problems: the log, its replication, the readers, and deleting data.

### Part P1: Partitioned append-only log and storage (F1, F2, F3, N1)
Absorb 1 GB/s on ordinary brokers, keep per-key order, and let many groups read the same data at
different positions.

| option | pros | cons |
|---|---|---|
| database rows, deleted on ack | familiar | an index entry and a delete per message (random IO); no replay |
| in-memory queue with per-message acks | low latency at small scale; flexible routing | memory-bound; per-message state × consumers; no replay |
| **partitions as append-only segmented logs** | sequential IO, page cache, zero-copy; reader state = one offset | order only within a partition; parallelism ≤ partitions; adding partitions remaps keys |

**Choice:** the producer hashes the key to a partition, batches and compresses. The leader appends the
batch to the active segment as-is. A sparse index maps offsets to file positions, so reads seek once
and then stream.

```diagram
part:P1
```

### Part P2: Replication and leader election (N2, N3)
No acked message may be lost when a broker or zone dies, and there must never be two leaders for
one partition.

| option | pros | cons |
|---|---|---|
| async primary → backup | fastest produce | acked writes lost on failover |
| sync to all replicas | no loss | one slow replica stalls the partition |
| Raft quorum per partition | well-understood safety | ~50k Raft groups to heartbeat; a lost majority blocks writes |
| **leader + in-sync replicas (ISR), acks=all, min ISR 2, controller elects** | no loss; slow replicas leave the ISR instead of blocking | needs a controller; unclean election trades loss for availability |

**Choice:** replication factor 3 across zones, with followers pulling from the leader. `acks=all` waits
for the ISR, and `min.insync.replicas=2` refuses writes rather than accept them on one copy. A small
Raft controller quorum (KRaft, or ZooKeeper/etcd) holds metadata and elects leaders from the ISR with
a bumped **epoch**, so a deposed leader's late writes are rejected.

```diagram
part:P2
```

### Part P3: Consumer groups and offsets (F3, F4)
Each application gets every message once across its instances. Instances come and go, and a
restarted one resumes or rewinds.

| option | pros | cons |
|---|---|---|
| broker pushes and tracks each ack | simple clients | ~3M ack updates/s; floods slow consumers |
| **consumers pull; one committed offset per (group, partition); coordinator assigns** | state is one integer; natural backpressure; free replay | parallelism ≤ partitions; rebalances pause; head-of-line blocking per partition |

**Choice:** a group coordinator, picked by hashing the group id, tracks membership with heartbeats
and assigns partitions using sticky, cooperative rebalancing. Members fetch from leaders and
periodically commit offsets to a compacted internal topic. Rewinding means seeking to an older
offset, or to a timestamp through the time index.

```diagram
part:P3
```

### Part P4: Retention and compaction (F5, N4)
Disks must stay bounded, keyed topics should keep the latest value per key, and long retention should
be affordable.

| option | pros | cons |
|---|---|---|
| delete on consume | small disks | impossible with several groups; no replay |
| per-message TTL | precise | per-message bookkeeping, random deletes |
| **delete whole closed segments by time/size** | an O(1) file delete | granularity of a segment |
| **compaction for keyed topics** | bounded by key count; a changelog becomes a table | background IO; deletes need tombstones |
| **tiered storage** | months of data at object-storage prices | slower historical reads |

**Choice:** all three, per topic. Delete-by-segment is the default, compaction serves keyed
"latest value" topics, and closed segments are uploaded to object storage so retention no longer
depends on broker disk.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** one broker with an in-memory queue over a database table, deleting on ack. Random IO,
a single point of failure, and no replay.
```diagram
v1
```
**v2, compose P1:** partitions spread over brokers, each an append-only segmented log read by offset.
There is still one copy of everything.
```diagram
v2
```
**v3, compose P2:** three replicas per partition, ISR and acks=all, and a controller quorum electing
leaders.
```diagram
v3
```
**v4, compose P3:** consumer groups, a coordinator, and committed offsets in a compacted topic.
```diagram
v4
```
**v5, compose P4:** the log cleaner handles retention, compaction and tiering to object storage.
```diagram
v5
```

## 6. Deep dives
- **Delivery semantics.** Committing before processing gives at-most-once. Processing then committing
  gives **at-least-once**, which is the default. The **idempotent producer** (producer_id + a
  per-partition sequence) removes duplicates from produce retries for free. **Exactly-once** inside
  the system uses transactions that write output records and consumer offsets atomically. Effects on
  external systems still need their own idempotency.
- **Push vs pull.** Consumers run at very different speeds. Pull with long-poll (`max_wait_ms`,
  `min_bytes`) lets each one set its pace and catch up in big batches, while the broker stays
  stateless about them.
- **Partition count and hot keys.** Size for peak ÷ ~10 MB/s per partition and for the maximum
  number of consumers, with headroom. Adding partitions later remaps keys and breaks per-key order
  across the change. A single hot key is capped by one partition, so salt the key if its order
  doesn't matter.
- **Speed.** Producers batch and compress, batches stay intact on disk, recent data is served from
  the page cache, and `sendfile` copies file to socket with no user-space copy. That is how 1 GB/s
  fits on ordinary machines.
- **High watermark.** Consumers only see records that every ISR member has. Otherwise a consumer
  could read a message that disappears when the leader fails over.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Kafka](#/topic/system-design/kafka) | the reference implementation of this design | Pulsar (brokers + BookKeeper storage), Redpanda |
| [ZooKeeper / etcd](#/topic/system-design/zookeeper-etcd) | controller quorum: metadata and leader election | Kafka's built-in KRaft (Raft) |
| [Object storage](#/topic/system-design/object-storage) | tiered storage for old segments | HDFS |

## 8. Patterns
- [Idempotency](#/topic/system-design/idempotency): producer sequence numbers make retries safe.
- [Backpressure](#/topic/system-design/backpressure): pull-based consumers lag instead of drowning.
- [Hot keys](#/topic/system-design/hot-keys): skewed keys overload one partition leader.
- [Event sourcing](#/topic/system-design/event-sourcing): a compacted topic is a durable changelog that
  can rebuild state.
- The transferable shape is a **replicated, partitioned append-only log**. Make writes sequential,
  make reader state a position, replicate with one leader per shard elected by a small consensus
  group, and expire data by whole files. Databases' write-ahead logs, replicated state machines and
  change-data-capture pipelines all share it.

## 9. Evaluation
- **Bottlenecks:** hot partitions, controller metadata at very high partition counts, consumer
  parallelism capped by partitions, and rebalances in big groups.
- **Failures:** if a broker dies, the controller moves leadership to ISR members within seconds,
  producers retry idempotently, and clients refresh metadata. If a zone is lost, two replicas remain
  and min ISR is still met. A slow follower leaves the ISR. If a consumer dies, its partitions are
  reassigned and resume from the committed offset.
- **Monitoring:** under-replicated and offline partitions, ISR shrink rate, produce/fetch p99, consumer
  lag per group (in messages and seconds), disk usage against retention, and controller elections.
- **The 30-second answer:** topics are split into partitions; each partition is an append-only log of
  segment files on its leader, replicated three times across zones. Producers hash keys to partitions
  and write with acks=all to the in-sync replicas. A Raft controller elects leaders with epochs.
  Consumers pull by offset, and groups split partitions and commit offsets to a compacted topic.
  Retention deletes whole segments, compacts keyed topics and tiers old data to object storage.

## 10. Tips and common mistakes
- Don't design a classic queue that deletes messages on ack. Multiple groups and replay need a log.
- Say what an ack means: `acks=all` with min ISR 2, not "it's on disk somewhere".
- Order is per partition. Promise per-key order, never a global one.
- Partition count is hard to change, so justify the number you choose.
- Size the cluster from **disk** (retention × replicas) and **network**, not from message count.

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [sharding](#/learn/system-design/sharding)
- [Replication](#/topic/system-design/replication) and [consensus and coordination](#/topic/system-design/consensus-coordination)
- [Stream processing](#/topic/system-design/stream-processing) on top of the log
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
