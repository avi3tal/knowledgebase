## Architecture at a glance

Before the algorithms, see where load balancing sits in a real system. This is an online shop
balanced at three tiers: DNS picks a region, an L4 load balancer spreads connections, and L7
proxies route each request to a stateless service pool. Play the figure, then switch the tabs: a
flash sale, a whole region going down, and a rolling deploy.

```figure
system-overview
```

### Zoom in: L7 routing

Everything interesting happens per request at the L7 proxy: route by path, skip unhealthy
instances, pick the least busy one, retry safely. Watch the decision points, then try the tabs
for an instance returning 503, a whole pool going unhealthy, and sticky routing.

```figure
l7-routing
```

### Zoom in: health checks

The "healthy instance?" box above is fed by health checks. Watch the thresholds: one missed
probe changes nothing, three eject the instance. The tabs show recovery with slow start, a deep
check that takes the whole pool down, and passive outlier detection.

```figure
health-probes
```

### How it scales

Each stage adds capacity and removes the previous stage's single point of failure: one server,
then a pool behind a load balancer, then several availability zones, then several regions.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Layers | L4 only · L7 only · L4 in front of L7 | **L4 → L7** | L4 scales connections cheaply; L7 routes by path and retries per request |
| Where TLS ends | each service · L7 proxy · L4 passthrough | **L7 proxy**, re-encrypt inside if required | One place for certificates; the proxy needs plaintext to route |
| Algorithm | round robin · least requests · consistent hash | **Least outstanding requests** | Adapts to slow instances; use hashing only when cache locality matters |
| Session state | sticky sessions · shared store · signed token | **Shared session store** | Any instance can serve any user; restarts and scale-in lose nothing |
| Health checks | active probes · passive outlier detection | **Both**, with shallow liveness | Probes catch dead instances, real traffic catches failing ones |
| Global routing | GeoDNS · anycast | **GeoDNS with short TTLs** | Works with any provider; anycast fails over faster but needs your own network |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| LB as a single point of failure | one load balancer instance | Total outage | Active/passive pair with a floating IP, or a managed zone-redundant LB |
| Health-check cascade | deep check fails on a shared dependency | Whole pool ejected | Shallow /healthz, panic mode when all instances look unhealthy |
| Retry storm | proxies retry 5xx on an overloaded pool | Load doubles exactly when it hurts | Retry once, idempotent requests only, retry budget per route |
| Uneven load | long-lived connections, sticky sessions | One instance hot, others idle | Balance requests not connections (HTTP/2 at L7), shared session state |
| Slow failover | high DNS TTL, resolvers that ignore it | Users stuck on a dead region | 30–60 s TTLs, anycast or client retry to a second hostname |
| Cold instances | autoscaling or deploys at peak | Fresh instances overloaded and fail checks | Slow start, pre-warming, scale ahead of known events |
