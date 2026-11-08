# Cassandra and wide-column stores

> Technology · Ideas: partition key, clustering key, query-first modelling, LSM writes, tunable consistency

Cassandra (and its relatives ScyllaDB, HBase and Bigtable) is a database built for **huge write
volumes spread over many cheap nodes**. There is no leader: every node accepts writes, data is
placed on a [consistent-hashing](#/learn/system-design/consistent-hashing) ring, and you add
capacity by adding nodes. The tabs show a replica down, a partition that grows too big, and the leader-based alternative.

```figure
ring-placement
```

> [!NUMBERS] Linear scaling
> - ~10k–20k replica writes/s per node (more for ScyllaDB).
> - Each client write is stored RF = 3 times: 200k client writes/s × 3 = 600k replica
>   writes/s ÷ 20k per node ≈ **30 nodes**. Size for the replicated rate, not the client rate.
> - Partition reads by key: typically **1–5 ms**.

The price is the data model. You don't get joins, ad-hoc `WHERE` clauses or multi-row transactions.
You design **one table per query**, and the primary key decides everything.

## The primary key has two parts
```sql
PRIMARY KEY ((conversation_id), seq)   -- (partition key), clustering key
```
- The **partition key** (`conversation_id`) is hashed to place the partition on the ring. All
  rows of one partition live together on the same replicas.
- The **clustering key** (`seq`) sorts rows inside the partition on disk, so "the latest 50
  messages of c1" is a single seek plus a sequential read.

On disk each partition is one contiguous, sorted run:

| partition | rows, in clustering order |
|---|---|
| c1 | seq 1 "hi" · seq 2 "sup" · seq 3 "ok" |
| c2 | seq 1 "yo" · seq 2 "ok" |
| c3 | seq 1 "hey" |

A query that names the partition key touches one partition. A query that doesn't (say, "all
messages whose body is ok") has to visit **every** partition on every node. Cassandra refuses it
unless you add `ALLOW FILTERING`, and in production that is almost always a bug.

## Why writes are cheap
Writes never update in place. Each replica does two appends and acknowledges; turning memory
into files happens later. That's an LSM tree: sequential I/O only, so writes stay fast even on
spinning disks.

```figure
write-path
```

Reads pay for it: a key's cells may be spread over the memtable and several SSTables, which is
why bloom filters and compaction matter.

```figure
read-path
```

> [!PITFALL] Deletes are writes too
> A delete writes a **tombstone** that hides older cells until compaction removes it (after
> `gc_grace_seconds`, 10 days by default). A queue-like table that deletes as it reads makes
> every read wade through thousands of tombstones.

Step through the trace: inserts arrive out of order but each partition stays sorted, then compare
the cost of a partition query with a scan.
