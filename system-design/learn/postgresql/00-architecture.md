## Architecture at a glance

Before MVCC and locks, see the system an architect would draw. This is a hotel booking platform:
guests search, book and pay, and every confirmed booking must survive any single failure. One
PostgreSQL primary is the source of truth; everything else hangs off its write-ahead log (WAL).
Play the figure, then switch the tabs: a holiday sale, a replica that falls behind, and a schema
migration on a 2 TB table.

```figure
system-overview
```

### Zoom in: one booking transaction

The interesting part of a booking is short: lock a few rows, write, commit, wait for the standby.
Watch which step holds locks and which step the commit waits for. Then try the tabs: the standby
disappears, a batch job holds the rows, and the faster commit that can lose data.

```figure
commit-path
```

### Zoom in: failover

A replica that can take over is only half the story; the other half is making sure exactly one
node accepts writes. Watch the leader lock. The tabs replay a crash, a network partition that
would create two primaries, and the async-only design that is faster but loses the tail.

```figure
failover
```

### How it scales

The design changes as the data and the write rate grow: one instance, then a pooler and replicas,
then partitioned tables, then several primaries split by domain or sharded by key.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Replication mode | async · one sync standby · quorum (ANY 1 of 2) | **Quorum sync** in the region, async to other regions | No confirmed booking is lost on failover, and one slow standby doesn't stall commits |
| Connections | direct · per-app pool · shared pooler (transaction mode) | **Shared pooler** in front of the primary and replicas | Thousands of autoscaled clients fit in ~150 backends; cost: no session state (SET, advisory locks) across transactions |
| Read routing | everything on the primary · replicas for all reads · replicas for lag-tolerant reads | **Lag-tolerant reads on replicas**, read-after-write on the primary | Scales browsing without showing a guest a stale copy of their own booking |
| Failover | manual · automatic with a leader lock and fencing | **Automatic** (Patroni-style, etcd lock) | ~30 s of write errors instead of a page at 3 a.m., and never two primaries |
| Feeding search and analytics | dual writes from the API · nightly export · CDC from the WAL | **CDC** | Only committed changes, in commit order, with no second write path to keep consistent |
| Growing past one primary | bigger machine · partitioning · split by domain · sharding | **Bigger box and partitioning first**, then domains, shard last | Each step keeps more of ACID-in-one-place than the next |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Connection exhaustion | API autoscales during a sale | "too many clients", the primary runs out of memory | Pooler, a hard max_connections, per-service pool limits |
| Stale reads | Replica lag from long queries or write bursts | Guests see rooms that are already gone | Lag-aware routing, read-after-write on the primary, reports on the warehouse |
| Split brain | Network partition during failover | Two primaries accept conflicting bookings | Leader lock with TTL, self-demotion (fencing), a sync standby required to commit |
| Blocking migration | Plain ALTER TABLE / CREATE INDEX on a big table | Writes blocked for minutes | CONCURRENTLY, lock_timeout, nullable columns, batched backfills |
| Bloat and vacuum debt | Long or idle-in-transaction sessions | Slow queries, emergency anti-wraparound vacuum | idle_in_transaction_session_timeout, monitor xid age, partition big tables |
| Bad write replicated | A buggy deploy deletes rows | The mistake reaches every replica in ms | WAL archive + point-in-time recovery, a delayed replica, rehearsed restores |
