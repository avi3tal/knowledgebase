## Architecture at a glance

Before the algorithms, see the system an architect would draw. This is a public API platform
(mobile apps, a web app and partner integrations) that protects its services with rate limits.
Play the figure, then switch the tabs: a bot flood, a counter shard going down, and a rule change.

```figure
system-overview
```

### Zoom in: the limiter's decision

Everything the limiter does for one request is cheap and local except one atomic call to the
counter store. That call is where latency, correctness (races) and availability (store down) live.

```figure
limiter-internals
```

### How it scales

The design changes as traffic grows: one gateway with memory counters, then shared counters,
then a sharded counter cluster with token leases, then per-region limits.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Where to limit | client · gateway · each service | **Gateway** (plus service-level for costly endpoints) | One place for every service; rejected requests never reach them |
| What to count by | IP · user · API key · key + endpoint | **API key + endpoint**, IP for anonymous calls | Fair per customer, and stricter rules for expensive routes |
| Algorithm | token bucket · sliding window · fixed window | **Token bucket** | Allows real-world bursts with 2 numbers per key |
| Counter store | local memory · shared store · sharded cluster | **Shared store**, sharded when > ~100k checks/s | Global limit across gateways with atomic operations |
| When the store is down | fail open · fail closed | **Per route** | Availability for reads; protection for login, OTP and payments |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Lost updates | read-then-write from many gateways | Limits silently exceeded | Atomic INCR or a server-side script |
| Store outage | counter shard down | No protection, or everyone blocked | Per-route fail policy, replicas, short timeouts |
| Retry storm | clients retry 429 immediately | Load multiplies on the edge | Retry-After, client backoff with jitter, edge blocking |
| Hot key | one tenant at 30% of traffic | One counter shard saturates | Local token leases, a dedicated shard for that key |
| Multi-region overshoot | client sprays regions | Brief overshoot of the global limit | Per-region quotas, async sync, state it as a trade-off |
