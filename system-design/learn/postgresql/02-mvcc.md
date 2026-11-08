## MVCC: readers don't block writers

PostgreSQL never updates a row in place. An `UPDATE` marks the current version as replaced
(sets its `xmax` to the writer's transaction id) and appends a **new version**. Each
transaction gets a **snapshot** when it starts: the set of transactions committed at that
moment. It sees exactly the versions created by those transactions and not yet replaced by
them.

```
 versions of row a          T2 (began before T3 committed)   T4 (began after)
 [a=10  xmin=1 xmax=3]  ◄── sees this                         ✗ replaced by 3
 [a=20  xmin=3 xmax=0]      ✗ 3 not in its snapshot       ◄── sees this
```

So a long report and a stream of updates run side by side without locking each other. The
cost is **dead versions**: every update leaves one behind, and `VACUUM` has to reclaim them. A
table with 5k updates/s produces ~430M dead tuples a day. If autovacuum falls behind, the
table bloats and scans slow down.

Step through it below. T2 starts, T3 updates `a` and commits, yet T2 still reads the old value,
while T4, which started later, reads the new one.

## Isolation levels and locks
| level | what it guarantees | typical use |
|---|---|---|
| **Read committed** (default) | each statement sees a fresh snapshot | most OLTP |
| **Repeatable read** | one snapshot for the whole transaction | reports, consistent reads |
| **Serializable** | as if transactions ran one at a time; conflicts abort | invariants across rows |

MVCC handles read/write conflicts. For **write/write** races (two buyers, one seat) you still
choose one of:
- **Pessimistic:** `SELECT … FOR UPDATE` locks the row until commit. Simple, but hot rows
  queue up, and 1 row at ~2 ms per transaction caps out at ~500 writes/s.
- **Optimistic:** `UPDATE … SET v = v+1 WHERE id = ? AND v = ?` and retry on 0 rows, see
  [optimistic concurrency](#/topic/system-design/optimistic-concurrency).
- **Constraints:** `UNIQUE (event_id, seat_id)` or `CHECK (qty >= 0)` makes the database the
  referee.

## Scaling a relational database
```
writes ──► primary ──WAL stream──► replica ──► reads (lag ~ms-s)
                    └────────────► replica ──► reads
```
1. **Indexes** on the columns you filter by. Every index also slows each write a little.
2. **Read replicas** for read-heavy load, at the price of replication lag.
3. **Connection pooling** (PgBouncer): each Postgres connection is a process using ~10 MB, so
   thousands of app connections need a pooler.
4. **Partitioning** a big table by time or hash inside one node, then **sharding** across
   nodes (by `merchant_id`, `event_id`) once one primary can't absorb the writes. Cross-shard
   transactions and joins then become your problem.
