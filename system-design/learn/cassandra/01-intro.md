# Cassandra and wide-column stores

> Technology · Ideas: partition key, clustering key, query-first modelling, LSM writes, tunable consistency

Cassandra (and its relatives ScyllaDB, HBase and Bigtable) is a database built for **huge write
volumes spread over many cheap nodes**. There is no leader: every node accepts writes, data is
placed on a [consistent-hashing](#/learn/system-design/consistent-hashing) ring, and you add
capacity by adding nodes. Throughput grows close to linearly, so 10 nodes doing ~20k writes/s each
give you ~200k writes/s.

The price is the data model. You don't get joins, ad-hoc `WHERE` clauses or multi-row transactions.
You design **one table per query**, and the primary key decides everything.

## The primary key has two parts
```
PRIMARY KEY ((conversation_id), seq)
              └ partition key ┘  └ clustering key ┘

 hash(conversation_id) ─► picks the nodes that own the partition
 seq                   ─► sorts rows inside the partition on disk

partition c1  │ seq 1 "hi" │ seq 2 "sup" │ seq 3 "ok" │   ◄── one contiguous, sorted run
partition c2  │ seq 1 "yo" │ seq 2 "ok"  │
partition c3  │ seq 1 "hey"│
```
- The **partition key** is hashed to place the partition on the ring. All rows of one partition
  live together on the same replicas.
- The **clustering key** orders rows within the partition, so "the latest 50 messages of c1" is a
  single seek plus a sequential read: typically 1–5 ms.

A query that names the partition key touches one partition. A query that doesn't (say, "all
messages whose body is ok") has to visit **every** partition on every node. Cassandra refuses it
unless you add `ALLOW FILTERING`, and in production that is almost always a bug.

## Why writes are cheap
Writes never update in place. A write is appended to a commit log, put into an in-memory memtable,
and acked. Memtables are flushed into immutable sorted files (SSTables), and background
**compaction** merges them. That's an LSM tree: sequential I/O only, so writes stay fast even on
spinning disks. Reads may have to check several SSTables, which is why bloom filters and
compaction matter.

Step through the trace: inserts arrive out of order but each partition stays sorted, then compare
the cost of a partition query with a scan.
