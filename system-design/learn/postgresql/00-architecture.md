## Architecture at a glance

Before MVCC and locks, see the system an architect would draw. This is a SaaS invoicing and
accounting platform: tenants' apps issue invoices and record payments, and every payment becomes
balanced entries in a double-entry ledger that must survive any single failure. One PostgreSQL
primary is the source of truth; everything else hangs off its write-ahead log (WAL). Play the
figure, then switch the tabs: the month-end close, a WAL archive that stalls, and retiring a
closed year of ledger partitions.

```figure
system-overview
```

### Zoom in: posting a payment

Posting a payment is short: lock one invoice row, update it, insert the ledger entries, commit,
wait for the standby. Watch which step holds the lock and which step the commit waits for. Then
try the tabs: two payments for the same invoice, a standby that disappears, and a journal that
doesn't balance.

```figure
payment-posting
```

### Zoom in: failover with fencing

A standby that can take over is only half the story; the other half is making sure exactly one
node accepts writes. Watch the leader key. The tabs replay a crash, a network partition that would
create two primaries, and a planned switchover for maintenance.

```figure
fenced-failover
```

### How it scales

The design changes as tenants and data grow: one instance, then a pooler and replicas, then a
ledger partitioned by month, then shards that each own a set of tenants.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Ledger integrity | checks in app code · row CHECKs · CHECKs + deferred constraint trigger per journal | **Constraints in the database**: row CHECKs, a deferred trigger for debits = credits | Every writer (API, close jobs, a manual fix) obeys the same rules, and a bad journal fails as a whole |
| Concurrent payments on an invoice | optimistic version column · SELECT … FOR UPDATE · SERIALIZABLE | **Row lock on the invoice** | One short, predictable wait on one row; serializable retries would spike exactly at month-end |
| Replication mode | async · one sync standby · quorum (ANY 1 of 2) | **Quorum sync** in the region, async to other regions | No confirmed payment is lost on failover, and one slow standby doesn't stall commits |
| Large ledger table | one table · monthly partitions by posting date | **Monthly partitions** | The hot month stays in memory, and closed years are detached instead of deleted; cost: keys must include the month |
| Feeding search and the warehouse | dual writes from the API · nightly export · CDC from the WAL | **CDC through a logical slot** | Only committed changes, in commit order, with no second write path to keep consistent |
| Growing past one primary | bigger machine · split by domain · shard by tenant | **Bigger box and partitioning first**, then shard by tenant | A tenant's invoice and ledger stay in one place, so a posting is still one ACID transaction |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Connection exhaustion | API autoscales at month-end | "too many clients", the primary runs out of memory | PgBouncer in transaction mode, a hard max_connections, per-service pool limits |
| Lock queues | a close job updates many invoices in one transaction | Payments wait, then time out | Small batches, lock_timeout on jobs, heavy jobs outside peak hours |
| Split brain | network partition during failover | Two primaries post conflicting payments | Leader key with a TTL, self-demotion and a watchdog (fencing), a sync standby required to commit |
| Disk full from WAL | WAL archive or a CDC slot stops consuming | The primary stops accepting writes | Alerts on archiver failures and slot lag, max_slot_wal_keep_size, alerts on free disk space |
| Uniqueness across partitions | a unique key on the ledger without the month | Constraint can't be created, or duplicates slip in | Include the month in the key, or enforce global uniqueness (invoice numbers) on the unpartitioned invoices table |
| Bad write replicated | a buggy close job posts wrong entries | Wrong balances on every replica within ms | Fix with reversing journal entries, WAL archive + point-in-time recovery, rehearsed restores |
