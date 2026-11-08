## Architecture at a glance

Before the commands, see the system an architect would draw. This is a mobile game backend that
uses Redis in four roles next to a relational player database: sessions, rate counters,
leaderboards and live events over pub/sub. Watch which data lives only in Redis and how each piece
can be rebuilt. Play the figure, then switch the tabs: a tournament final, the session primary
failing, and a push-gateway deploy.

```figure
system-overview
```

### Zoom in: failover

High availability is where Redis surprises people. Follow how Sentinels decide the primary is
dead, promote a replica and redirect clients. The tabs show the writes that can vanish, a client
that keeps the old address, and how Redis Cluster does the same job without Sentinels.

```figure
sentinel-failover
```

### How it scales

The design changes as the game grows: one node, then a primary with replicas, then a sharded
cluster, then a cluster per region with global views built on top.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Source of truth | Redis · relational DB | **Player DB**; Redis holds derived state | Async replication can lose the last writes; anything in Redis must be rebuildable or cheap to lose |
| One Redis or several | one shared deployment · one per role | **One per role** (sessions, counters, boards, pub/sub) | A flood of rate checks or a big board can't evict sessions, and each role gets its own persistence and eviction policy |
| Persistence | none · RDB snapshots · AOF every second | **AOF every second for sessions, none for counters**, RDB for boards | Match the cost to how painful a loss is; boards can be replayed from the DB |
| High availability | Sentinel · Redis Cluster | **Sentinel first**, Cluster when one node's RAM or CPU is not enough | Sentinel keeps every multi-key command; Cluster adds sharding at the cost of hash tags and slot-aware clients |
| Live messages | pub/sub · Streams · a message broker | **Pub/sub for presence and typing**, Streams or the DB for must-deliver | Pub/sub drops messages when nobody is listening |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Lost writes on failover | primary dies before replicating | Recent sessions or scores disappear | Keep the truth in the DB, `WAIT` for critical writes, rebuild jobs |
| Memory full | growth, keys without TTL | Writes fail or useful keys are evicted | TTL on every session and counter, `maxmemory` policy per role, alerts at 70% |
| Blocking command | `KEYS *` or a huge range on the single command thread | Every client waits | Ban O(n) commands in production, `SCAN`, cap range sizes |
| Hot key | one tournament board for everyone | One node saturates | Batch and pipeline updates, read top-N from replicas or a local copy |
| Missed pub/sub messages | subscriber restarting or slow | Silent message loss | Clients resync on reconnect; use Streams where loss matters |
| Snapshot fork pause | large dataset with RDB/AOF rewrite | Latency spikes, memory headroom used up | Leave about 2× memory headroom, snapshot on a replica |
