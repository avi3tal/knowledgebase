# Solution: distributed key-value store

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The API is three calls; everything hard is non-functional. The cart team's **"never refuse a write"**
puts us on the available side of CAP, and **some node fails every week**. So the design is less about
speed (72k ops/s per node is easy for an SSD) and more about where keys live, how many copies answer,
what happens when copies disagree, and how the cluster heals itself without an operator.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | `put(key, value)`, `get(key)`, `delete(key)`; keys ≤ 256 B, values ≤ 1 MB (avg ~1 KB) |
| F2 | Per-request consistency knobs (fast vs quorum) |
| F3 | Add or remove servers without downtime |
| N1 | Writes are never refused because of node failures or a partition (AP by default) |
| N2 | Eventually consistent; concurrent writes are surfaced, never silently lost |
| N3 | p99 < 10 ms for get and put at 1M reads/s + 200k writes/s |
| N4 | Survives the loss of any node or one availability zone |

**Assumptions:** 20B keys × ~1.2 KB including key and metadata; 4 TB disks kept at most half full; one
region, three AZs. **Out of scope:** range scans, secondary indexes, multi-key transactions,
cross-region replication. Dropping scans is what makes hash partitioning safe.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| raw data | 20B × 1.2 KB | **24 TB** |
| with 3 replicas | 24 TB × 3 | **72 TB** |
| nodes | 72 TB / (4 TB × 0.5) | **36**, round up to ~40 |
| replica operations | 1M × R(2) + 200k × N(3) | **2.6M /s** |
| per node | 2.6M / 36 | **~72k /s** |
| data moved when one node joins | 72 TB / 37 | **~2 TB**, streamed from many peers |

72k ops/s per node fits an LSM engine on SSD with room to spare, so we don't need exotic hardware.
The interesting numbers are the failure rate (weekly) and the growth (~20 new nodes a year): both
mean data is constantly moving, so placement and repair must be cheap and automatic.

## 3. API and data model
- `PUT /kv/{key} {value, context, w?}` → `200 {context}`. The **context** is the opaque version
  vector the caller got from its last read; it lets the store tell an overwrite from a concurrent
  write.
- `GET /kv/{key}?r=` → `200 {values[], context}` or `404`. More than one value means concurrent
  **siblings**; the client merges them and writes back with the context.
- `DELETE /kv/{key} {context}` → `204`. It writes a **tombstone**, not a removal.
- `record(key, value, version vector [(node, counter)…], tombstone, ts, checksum)` lives in each
  node's LSM engine.
- `ring map(vnode token → node, status, generation)` is tiny, held in RAM on every node and spread
  by gossip.

## 4. Decompose: the parts
Five sub-problems, each solvable on its own, then merged by node id.

### Part P1: Partitioning: which nodes own a key (F1, F3, N3)
| option | pros | cons |
|---|---|---|
| hash(key) mod N | trivial | changing N remaps almost every key |
| range partitioning + split manager | range scans | hot ranges; a central manager; scans aren't needed |
| **consistent hashing with virtual nodes** | a join moves ~1/N of keys, from many peers | a ring map everyone must agree on |

**Choice:** ~256 virtual nodes per server on a hash ring. A new server takes small slices from ~40
peers, so the ~2 TB it needs streams in parallel instead of draining one neighbour.

```diagram
part:P1
```

### Part P2: Replication and quorums (F2, N1, N4)
| option | pros | cons |
|---|---|---|
| single leader per partition | simple strong consistency | writes stall during elections; breaks N1 |
| leaderless, strict quorum | no failover; R + W > N | writes fail when 2 of 3 owners are unreachable |
| **leaderless, sloppy quorum + hints** | writes always find W healthy nodes | a read can briefly miss a hinted write |

**Choice:** N=3, one replica per AZ (walk the ring clockwise, skipping nodes in an AZ already
used). W=2 and R=2 by default, so R + W > N and a read overlaps the latest write. Callers may pick
W=1/R=1 for speed or R=3 for freshness.

```diagram
part:P2
```

### Part P3: Conflict resolution for concurrent writes (N2)
| option | pros | cons |
|---|---|---|
| last-write-wins on timestamps | one value, no client work | clock skew silently drops a write |
| **version vectors + siblings** | detects real concurrency; nothing lost | clients merge; vectors need pruning |
| CRDT values | automatic merge | only for supported types; heavier metadata |

**Choice:** each write increments the coordinator's entry in the key's version vector. If one
vector descends from the other, the newer one wins; if neither does, both are kept as siblings and
returned on the next read. The cart merges by union. LWW is an opt-in per table for data where
losing a write is fine.

```diagram
part:P3
```

### Part P4: Failure detection and repair (N1, N4, F3)
| option | pros | cons |
|---|---|---|
| central heartbeat monitor | one clear view | a single point of failure; false alarms when it is partitioned |
| **gossip + phi-accrual, then hints, read repair, Merkle trees** | decentralised; one tool per time scale | membership converges in seconds; more moving parts |

**Choice:** nodes gossip heartbeats and ring state every second; a phi-accrual detector turns
missed heartbeats into a suspicion level instead of a hard timeout. Healing works at three time
scales:
- **minutes:** a stand-in node keeps hints and replays them;
- **per read:** a coordinator that sees stale replicas writes the newest version back;
- **long term:** Merkle trees per range compare cheaply and stream only the keys that differ.

```diagram
part:P4
```

### Part P5: Storage engine on each node (N3, N4)
| option | pros | cons |
|---|---|---|
| B-tree, update in place | fast point reads | random writes: write amplification at our rate |
| **LSM tree** | sequential writes; bloom filters keep reads to ~1 seek | compaction I/O; reads may check several files |
| in-memory hash + log | fastest | 24 TB per replica set doesn't fit in RAM affordably |

**Choice:** append to a commit log (fsync in small batches), insert into a sorted memtable, flush
it as an immutable SSTable at ~64 MB, and compact in the background. Bloom filters skip SSTables
that can't hold the key.

```diagram
part:P5
```

## 5. Reduce: the high-level design
**v1, naive:** one server with a hash map in RAM and a WAL on disk. 72 TB and 1.2M ops/s don't fit,
and one failure takes everything down.
```diagram
v1
```
**v2, compose P1 and P5:** a coordinator places keys on the ring and each node stores its share in
an LSM engine. Data and load now spread, but each key has a single copy.
```diagram
v2
```
**v3, compose P2 and P3:** three replicas in three AZs, W=2/R=2, and version vectors on every
write, so concurrent puts become siblings. Nobody notices a dead node yet.
```diagram
v3
```
**v4, compose P4:** gossip finds the dead node C, D holds C's writes as hints and replays them, and
the anti-entropy worker closes whatever drift remains.
```diagram
v4
```

## 6. Deep dives
- **Deletes and resurrection.** Removing a key physically lets a replica that missed the delete
  "repair" the old value back. Write a **tombstone** instead, and purge it only after a grace period
  (e.g. 10 days) longer than the anti-entropy cycle.
- **Hot keys.** The per-node budget assumes uniform load; one viral key pins its three replicas.
  Read-hot keys get a client-side cache with a ~1 s TTL; known write-hot counters are salted into k
  sub-keys and summed on read.
- **Sloppy quorum caveat.** With hints, W=2 can be satisfied by a stand-in, so R + W > N no longer
  *guarantees* overlap during a failure. Say this out loud: it is the price of N1.
- **Version vector growth.** Every coordinator adds an entry. Cap the vector (e.g. 10 entries) and
  drop the oldest by timestamp; the rare false conflict becomes a sibling, which is safe.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Cassandra](#/topic/system-design/cassandra) | the shape we built: ring, vnodes, hints, LSM, tunable consistency | ScyllaDB, Riak |
| [DynamoDB](#/topic/system-design/dynamodb) | the managed version of the same ideas | Bigtable-style range stores |
| [etcd / ZooKeeper](#/topic/system-design/zookeeper-etcd) | optional: seed list and config, not on the request path | gossip alone |

## 8. Patterns
- [Optimistic concurrency](#/topic/system-design/optimistic-concurrency): the put carries the
  context of the read it was based on; the store detects concurrent writes instead of locking.
- [Hot keys](#/topic/system-design/hot-keys): uniform hashing doesn't help a single popular key.
- [Retries and DLQs](#/topic/system-design/retries-dlq): hinted handoff is a retry queue held by a
  neighbour.
- [Backpressure](#/topic/system-design/backpressure): throttle compaction and rebalance streaming so
  they don't eat the p99 budget.
- The transferable shape is **leaderless partitioned replication**: hash ring with vnodes, N copies,
  R/W as the consistency knob, versioned values, and background healing. Wide-column stores,
  replicated caches and object-store metadata layers reuse it.

## 9. Evaluation
- **Bottlenecks:** hot keys, compaction I/O spikes, rebalance traffic when nodes join.
- **Failures:** a node down is invisible to callers (sloppy quorum + hints); an AZ cut off still
  leaves two AZs for W=2/R=2; silent corruption is caught by block checksums and fixed by Merkle
  repair; a dead disk's vnodes are re-replicated from survivors.
- **Monitoring:** p99 per node and per operation, quorum failures, hint backlog, read-repair rate,
  siblings per key, disk fill, compaction backlog, gossip convergence time.
- **The 30-second answer:** consistent hashing with vnodes places keys; N=3 replicas across AZs with
  W=2/R=2 and a sloppy quorum keep writes always accepted; version vectors turn concurrent writes
  into siblings the client merges; gossip detects failures; hints, read repair and Merkle trees heal;
  each node is an LSM engine.

## 10. Tips and common mistakes
- Don't start with "use a leader per shard": it is fine for many systems but contradicts "never
  refuse a write". Tie each choice to N1 or N2.
- `hash mod N` is the classic trap; show how much moves when N changes.
- Don't claim LWW is "good enough" without mentioning clock skew and lost cart items.
- R + W > N is not linearizability, and a sloppy quorum weakens it further. Say so.
- Forgetting tombstones is the most common deep-dive miss.

## 11. Learn more
- [Consistent hashing](#/learn/system-design/consistent-hashing) and [sharding](#/learn/system-design/sharding)
- [Replication](#/topic/system-design/replication) and [CAP and consistency models](#/topic/system-design/cap-consistency)
- [Key-value store case study](#/topic/system-design/key-value-store)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
