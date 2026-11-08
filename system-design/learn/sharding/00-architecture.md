## Architecture at a glance

Before the partitioning schemes, see the system an architect would draw. This is a multi-tenant
SaaS (a project tracker used by thousands of companies) whose database is split by tenant. A
router turns each tenant into a shard, and a rebalancer moves tenants by editing the shard map.
Play the figure, then switch the tabs: a big tenant arriving, a shard primary failing, and a new
shard being added.

```figure
system-overview
```

### Zoom in: routing one query

Routing is two in-memory lookups on the happy path. Watch where the shard itself double-checks
ownership. The tabs show a router that has just restarted, a tenant that moved a moment ago, and
a query that has no tenant to route on.

```figure
route-request
```

### Zoom in: moving a tenant

Resharding is a series of small moves, each ending with one map flip. Watch which step is the
point of no return. The tabs show a target that fails mid-copy, a copy that never catches up,
and dual writes as an alternative.

```figure
tenant-move
```

### How it scales

The database changes as the product grows: one primary, then read replicas, then shards by
tenant, then regional shards so tenants are served, and their data stored, in their own region.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Shard key | user_id · tenant_id · row id hash · created_at | **tenant_id** | Every query is scoped to one tenant, so it stays on one shard with joins and transactions intact |
| Placement | range · hash % N · hash slots · directory | **Directory** (tenant → shard), new tenants placed by load | Any single tenant can be moved without touching the others |
| Where routing happens | library in each app · proxy tier · the database itself | **Proxy tier** with a cached map | One place to change routing; app servers stay simple |
| Global data | shard everything · one unsharded DB | **Unsharded Accounts DB** for plans, billing and the tenant list | Small, cross-tenant and rarely written |
| Resharding | rehash everything · move tenants live | **Live per-tenant moves** (copy, catch up, flip) | No downtime, and each step can be rolled back |
| Cross-tenant queries | scatter-gather · reporting store fed by change logs | **Reporting store** | Serving shards only ever run single-tenant queries |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Hot shard | a tenant grows far beyond the average | Its neighbours get slow | Per-shard metrics, move neighbours off, a shard of its own for the largest tenants |
| Stale map | a router misses an update | Query sent to the old shard | Shards reject non-owned tenants with the map version; router refreshes and retries |
| Map store outage | coordination service down | No new routes | Routers keep serving from their cached map; only moves stop |
| Move never converges | heavy writes during a copy | Long write pause or a stuck move | Throttle, schedule at quiet hours, abort without flipping |
| Cross-shard work | a feature needs two tenants at once | Distributed transactions creep in | Keep tenants isolated by design; use async workflows across tenants |
| Shard failover | primary dies | Errors for that shard's tenants; recent writes may be lost | Replica per shard, automated failover, idempotent retries |
