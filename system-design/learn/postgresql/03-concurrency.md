## Isolation levels and write conflicts
| level | what it guarantees | typical use |
|---|---|---|
| **Read committed** (default) | each statement sees a fresh snapshot | most OLTP |
| **Repeatable read** | one snapshot for the whole transaction | reports, consistent reads |
| **Serializable** | as if transactions ran one at a time; conflicts abort | invariants across rows |

MVCC handles read/write conflicts. For **write/write** races (two buyers, one seat) you still
choose a referee.

**Pessimistic: `SELECT … FOR UPDATE`.** Lock the row until commit. The tabs add a deadlock, the optimistic version-column alternative
and a lock held across a slow call.

```figure
row-lock
```

> [!PROS]
> - Simple and correct: the second writer waits, then sees the committed state.

> [!CONS]
> - Hot rows queue up: 1 row at ~2 ms per transaction caps out at ~500 writes/s.
> - Locks held across slow work (a payment call) block everyone behind them.

**Optimistic: a version column.** `UPDATE … SET v = v+1 WHERE id = ? AND v = ?`, and retry if
0 rows changed. See [optimistic concurrency](#/topic/system-design/optimistic-concurrency).

> [!PROS]
> - No locks held while the app thinks; great when conflicts are rare.

> [!CONS]
> - Under heavy contention most attempts fail and retry, wasting work.

**Constraints.** `UNIQUE (event_id, seat_id)` or `CHECK (qty >= 0)` makes the database itself the
referee: the second insert fails, whatever the application did.

> [!PROS]
> - Holds even with buggy or concurrent code paths; nothing to remember.

> [!CONS]
> - Only expresses what a constraint can: uniqueness, ranges, references.

## Scaling a relational database

The tabs replay this setup through a primary failure, a stale read-after-write, connection
exhaustion and a sharded alternative.

```figure
primary-replicas
```

1. **Indexes** on the columns you filter by. Every index also slows each write a little.
2. **Read replicas** for read-heavy load, at the price of replication lag.
3. **Connection pooling** (PgBouncer): each Postgres connection is a process using ~10 MB, so
   5 000 app connections would need ~50 GB. A pooler multiplexes them onto ~100 real ones.
4. **Partitioning** a big table by time or hash inside one node, then
   [sharding](#/learn/system-design/sharding) across nodes (by `merchant_id`, `event_id`) once
   one primary can't absorb the writes. Cross-shard transactions and joins then become your problem.
