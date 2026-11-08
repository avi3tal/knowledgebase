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

> [!NUMBERS] One well-tuned primary (NVMe, 32–64 cores)
> - Simple indexed reads: **~10k–50k/s**, ~1 ms each.
> - Single-row writes: **~5k–20k/s**. WAL fsync is the limit; batching commits helps.
> - Comfortable data size: **~1–5 TB**. Past that, vacuum, backups and new replicas get slow.
> - B-tree on 100M rows: ~500 keys per 8 KB page, so depth ≈ log₅₀₀(10⁸) ≈ **3**, and the
>   top levels stay cached.

Most interview workloads (a payment system at 1k writes/s, a ticketing site, an auction)
fit **one primary plus replicas**. Shard only when the write rate or the dataset outgrows one
node.

## Index lookup vs sequential scan
The table itself (the **heap**) is a pile of 8 KB pages in insertion order. Without an index,
`WHERE id = 42` must read **every page**: 100M rows at ~100 rows per page is ~1M pages. A B-tree
index keeps the keys sorted, with a pointer to each row's page, so the lookup is a short descent
plus one heap page.

```figure
index-lookup
```

Having an index doesn't mean it gets used. The query planner estimates both plans from table
statistics and picks the cheaper one:

```figure
planner-choice
```

> [!PITFALL] Indexes that silently don't help
> - A function on the column (`WHERE lower(email) = …`) needs an expression index.
> - A composite index `(merchant_id, created_at)` serves `WHERE merchant_id = ?` but not
>   `WHERE created_at > ?` alone: the leading column must be in the filter.
> - Every index slows every write a little and takes memory. Index the hot queries, not every column.

In the trace below the same key is found twice: by scanning all heap pages, then through a
sorted index. Watch `pages_read` against `probes`. On 100M rows that's ~1M pages scanned
against ~4 page reads.
