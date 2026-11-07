# Reference walkthrough: distributed key-value store

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
The API is tiny: **put / get / delete** by key. The hard parts are non-functional:
**never refuse a write** (availability over consistency, the AP side of CAP), **eventual consistency
with conflicts surfaced** rather than silently lost (tunable per request), **p99 < 10 ms**,
**durability across a node or AZ loss**, and **growth without downtime**. Scans, secondary indexes
and transactions are out of scope, and that is what makes hash partitioning possible.

## 2. Estimates
20B keys × ~1.2 KB ≈ **24 TB raw**, **~72 TB with 3 replicas**. At 4 TB per server kept half full
that is **~36 nodes** (round up to ~40). Load: reads hit R=2 replicas and writes hit N=3, so
1M × 2 + 200k × 3 = 2.6M replica operations/s, **~72k per node**. That fits an LSM engine on SSDs,
so the design is driven by placement and failure handling, not raw speed.

## 3. API and data
`PUT /kv/{key}` carries an opaque **context** (the version vector from the last read) so the store
can tell an overwrite from a concurrent write; `GET` may return **several sibling values** plus a
context; `DELETE` writes a **tombstone**. Each record stores value, version vector, tombstone flag
and checksum, in a per-node **LSM tree** (WAL, memtable, SSTables, bloom filters).

## 4. Evolving the design
- **v1:** one server, a hash map plus a WAL. 72 TB doesn't fit, 1.2M ops/s doesn't fit, and a
  single failure takes everything down.
- **v2:** a **coordinator** places keys on a **consistent-hash ring with virtual nodes**. Data and
  load spread, and growth moves ~1/N of keys. Each key still has one copy.
- **v3:** **N=3 replicas, one per AZ**, any node coordinates with **W=2 / R=2**, **version vectors**
  detect concurrent writes, **gossip** tracks membership, **hinted handoff** covers short outages,
  and **read repair + Merkle-tree anti-entropy** heal the remaining drift.

## 5. Deep dives
- **Partitioning.** `mod N` reshuffles almost everything when N changes; range partitioning
  creates hot spots and needs a split manager we don't need without scans. **Consistent hashing
  with vnodes** moves little data and spreads rebuild work across many peers.
- **Quorums.** A single leader per partition stalls writes during failover. Leaderless replication
  with **R + W > N** gives overlapping reads; a **sloppy quorum** keeps writes available in a
  partition at the cost of a brief window where a read can miss a hinted write.
- **Conflicts.** Last-write-wins on wall clocks silently drops writes under clock skew. **Version
  vectors** detect true concurrency; the client merges siblings (cart = union). LWW stays an opt-in
  for data where that loss is fine.
- **Repair.** Gossip with a suspicion-based failure detector (no central monitor to fail). Then
  three tools for three time scales: hints (minutes), read repair (on access), Merkle trees
  (everything else, streaming only the ranges that differ).

## 6. Wrap-up
Bottlenecks: hot keys (cache or salt), compaction I/O, rebalancing traffic (throttle). One node
down: invisible to callers. One AZ cut off: the other two still make quorums. Corruption:
checksums plus Merkle repair. Watch p99 per node, quorum failures, hint backlog, sibling counts,
disk fill and compaction backlog.

## Transferable pattern
**Leaderless partitioned replication:** hash ring with virtual nodes, N copies, R/W quorums as the
consistency knob, versioned values so concurrent writes are detected, and background healing
(hints, read repair, Merkle trees) with gossip for membership. The same toolkit appears in wide-column
stores, distributed caches with replication, and object-store metadata layers.
