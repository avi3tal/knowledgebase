# PostgreSQL / relational DB

> Technology · Ideas: tables + SQL, ACID transactions, constraints, B-tree indexes, MVCC, row locks

PostgreSQL (and MySQL, its closest cousin) stores data as **rows in tables** with a fixed
schema, and lets you change several rows **atomically** in one transaction. It's the default
answer for data where being wrong costs money: payments, orders, inventory, bookings, user
accounts. Pick something else only when a clear signal pushes you away from it.

What you get out of the box:
- **Transactions (ACID):** debit one account and credit another, and either both happen or
  neither does, even if the server crashes halfway.
- **Constraints:** `UNIQUE`, `FOREIGN KEY`, `CHECK (qty >= 0)`. The database rejects bad
  data, so a bug in one service can't oversell a seat.
- **Secondary indexes and joins:** query by any column, not only by the primary key.
- **Row locks:** `SELECT … FOR UPDATE` serialises writers on one row and leaves the rest of
  the table alone.

## Sizes worth remembering
```
one well-tuned primary (NVMe, 32-64 cores):
  simple indexed reads    ~10k-50k/s per node, ~1 ms
  single-row writes       ~5k-20k/s  (WAL fsync is the limit; batching helps)
  comfortable data size   ~1-5 TB    (past that, vacuum/backups/replicas get slow)
B-tree index on 100M rows: depth ~4 → 3-4 page reads per lookup (top levels stay cached)
```
Most interview workloads (a payment system at 1k writes/s, a ticketing site, an auction)
fit **one primary plus replicas**. Shard only when the write rate or the dataset outgrows one
node.

## Index lookup vs sequential scan
The table itself (the **heap**) is a pile of 8 KB pages in insertion order. Without an index,
`WHERE id = 42` must read **every page**. A B-tree index keeps the keys sorted with a pointer
to each row's page, so the lookup is a binary-search-like descent plus one heap page.

```
 index (sorted keys → page)        heap pages (insertion order)
 [ 3→p2 | 8→p0 | 15→p3 | 42→p1 ]   p0:[8 23 11]  p1:[42 5 19]  p2:[3 30 7]  p3:[15 2 27]
        └── descend O(log n) ───────────► read p1 only
```

In the trace below the same key is found twice: by scanning all heap pages, then through a
sorted index. Watch `pages_read` against `probes`. On 100M rows that's ~1M pages scanned
against ~4 page reads.
