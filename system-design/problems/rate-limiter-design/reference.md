# Solution: rate limiter

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The limiter sits on **every request**, so its own cost and its own failures become the API's cost and
failures. The data is tiny (a few GB) but extremely hot (~600k updates/s), and it must agree across 40
servers. The design comes down to three choices:
- a counting algorithm that is cheap per key;
- one shared, atomic store for the counts;
- a decision, made up front, about what happens when that store is gone.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Judge every request against the caller's limits; reject the excess with 429 and a retry hint |
| F2 | Limits are rules (user / API key / IP × endpoint) that operators change without a deploy |
| F3 | Callers see their remaining quota and reset time in headers |
| N1 | The decision adds < 5 ms at p99 |
| N2 | Limits hold across the fleet, not per server; a few % over-admission is fine |
| N3 | The limiter never takes the API down, except for sensitive rules (login) |

**Assumptions:** 10M active clients/day, peak 300k requests/s, about 2 rules match a request, about
100 B per counter. **Out of scope:** billing, and L3/L4 DDoS protection (the network provider handles it).

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| decisions | peak requests | **300k /s** |
| counter operations | 300k × 2 rules | **600k /s** |
| counter memory | 10M clients × 3 rules × 100 B | **3 GB** |
| counter nodes | 600k ÷ 100k ops/s per node | **6 primaries, 12 with replicas** |

Memory is easy: 3 GB fits on one box. The **operation rate and the 5 ms budget** are the hard part. They
rule out a disk-backed database and call for a sharded in-memory store reached in one round trip.

## 3. API and data model
- `check(key, rule_id, cost=1)` → `{allowed, remaining, reset_at, retry_after}`. This is an in-process
  call inside the gateway, not a network service.
- Public contract: any endpoint can answer `429 Too Many Requests` with `Retry-After` and
  `X-RateLimit-Limit / -Remaining / -Reset`.
- `PUT /admin/rules/{id} {match, limit, window_s, burst, failure_mode}` changes limits at runtime.
- `bucket:{rule_id}:{client}` → `{tokens, last_refill_ms}` with a TTL, in Redis.
- `rules(id, match, limit, window_s, burst, failure_mode, version)` lives in SQL: small, audited and
  versioned.

## 4. Decompose: the parts
Four sub-problems, each solved on its own, then merged.

### Part P1: Counting algorithm (F1, N1, N2)
| option | pros | cons |
|---|---|---|
| fixed window counter | one integer, `INCR` + `EXPIRE` | 2× the limit across a window boundary |
| sliding log | exact | one timestamp per request: up to 5,000 per API key |
| sliding window counter | two integers, smooth | approximate |
| **token bucket** | two numbers, explicit rate + burst, lazy refill | must pick a burst size |

**Choice:** token bucket. On each call, refill `(now − last_refill) × rate` tokens, capped at the burst,
then take one. No timers are needed, the state is two numbers, and there is no boundary spike.

```diagram
part:P1
```

### Part P2: Shared counter store (N1, N2)
| option | pros | cons |
|---|---|---|
| in-memory counters per server | free | up to 40× the quota; lost on restart |
| sticky routing by client | local counts become correct | uneven load; rebalancing resets counts |
| SQL table of counters | durable | 600k hot-row writes/s is far too slow |
| **sharded Redis Cluster** | ~1 ms, ~100k ops/s per node, TTLs | another tier; counts may reset on failover |

**Choice:** Redis Cluster keyed by `rule + client`, about 6 primaries with replicas. Losing a few counts
on failover is acceptable under N2.

```diagram
part:P2
```

### Part P3: Where the check runs (F1, F3, N1)
| option | pros | cons |
|---|---|---|
| middleware in each service | no extra hop | every team and language re-implements it |
| sidecar per service | uniform | traffic already crossed the network; one more thing per pod |
| separate limiter service | central | an extra network hop on every request |
| **API gateway behind the LB** | one choke point already on the path | the gateway tier must scale |

**Choice:** a filter inside the API gateway. Rejected traffic never reaches the 40 API servers, and the
rate-limit headers are added in one place.

```diagram
part:P3
```

### Part P4: Rules config and degraded mode (F2, N3)
| option | pros | cons |
|---|---|---|
| hard-coded in gateway config | simple | every change is a deploy |
| read the rules DB per request | always fresh | a query per request and a new single point of failure |
| **rules service + DB, cached in gateways, refreshed every 5 s** | free lookups, seconds of staleness | versioning needed for rollback |

**Choice:** cache the rule set in every gateway and refresh it every 5 s. If the rules service is down,
gateways keep the last good copy. Each rule carries `failure_mode`, so product and security each get
their answer (see the deep dives).

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** each of the 40 API servers counts in its own memory. Behind the load balancer a user gets
up to 40× the quota, restarts wipe the counts, and every team re-implements the logic.
```diagram
v1
```
**v2, compose P1, P2 and P3:** a gateway is the choke point, and token buckets live in Redis, updated
atomically in one round trip. Limits are now fleet-wide and cost about 1 ms.
```diagram
v2
```
**v3, compose P4:** rules become data behind a rules service, each with a failure mode. Allow/deny
events go to a stream for metrics, off the hot path.
```diagram
v3
```

## 6. Deep dives
- **Atomicity.** If a gateway reads and then writes, two gateways can both see 1 token and both allow
  the request. A distributed lock fixes that but adds a round trip and contention. Instead, run
  refill + take as one **Lua script**: the shard that owns the key serialises it.
- **Failure mode.** Use a 2 ms timeout on the Redis call. On timeout, **fail open** to an in-process
  bucket sized `limit ÷ number of gateways`, which gives coarse protection with the API still up. Rules
  marked sensitive (login) **fail closed**.
- **Hot keys.** One scraper at 50k req/s lands on a single shard. Once a client is denied, the gateway
  caches the deny until `reset_at`, which removes almost all of that client's Redis traffic.
- **Clocks.** Compute refills with the Redis server's time (`TIME` inside the script), not each
  gateway's clock, so skew between gateways can't mint tokens.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Redis](#/topic/system-design/redis) | token buckets, Lua for atomic refill + take | Memcached (no scripts), an in-house counter service |
| [Envoy / NGINX](#/topic/system-design/envoy-nginx) | the gateway that runs the limiter filter | a cloud API gateway, a service mesh sidecar |
| [PostgreSQL](#/topic/system-design/postgresql) | the versioned rules table | etcd for small configs |
| [Kafka](#/topic/system-design/kafka) | allow/deny events for metrics | a log pipeline |

## 8. Patterns
- [Backpressure](#/topic/system-design/backpressure): a 429 with `Retry-After` tells callers to slow
  down instead of piling up.
- [Hot keys](#/topic/system-design/hot-keys): one abusive client on one shard.
- [Distributed locking](#/topic/system-design/distributed-locking): considered and rejected in favour
  of a single atomic script on the owning shard.
- The transferable shape is **shared-counter admission control**. Decide at one choke point, keep the
  state in a fast shared store updated atomically, and decide up front how to degrade. Quotas,
  concurrency limits, seat holds and fraud velocity checks have the same shape.

## 9. Evaluation
- **Bottlenecks:** a hot client key on one shard (cache the deny locally), the gateway tier (scale it
  out behind the LB), and the script's cost (keep it O(1)).
- **Failures:** if a shard is lost, its replica is promoted and a few counts reset. Store timeouts fail
  open to a local limit, except login, which fails closed. A bad rule push is rolled back by version.
- **Monitoring:** decision latency p99, Redis timeouts, the fail-open count, the 429 rate per rule and
  per top client, and the rules version on each gateway.
- **The 30-second answer:** a token bucket per rule and client, held in a sharded Redis cluster and
  updated by one Lua script per request. The check runs as a filter in the API gateway behind the load
  balancer, so it costs one ~1 ms round trip. Rules live in a DB and are cached in each gateway. If
  Redis is unreachable the gateway fails open to a local limit, except for login.

## 10. Tips and common mistakes
- Don't count in each server's memory "for speed". Behind a load balancer the limit becomes N× the
  quota.
- Don't propose a sliding log for 5,000/hour limits without checking its memory cost.
- Don't use read-then-write against Redis: say "atomic" and show how it is done.
- Fail open or fail closed is a product and security decision. Ask, then make it per rule.
- Memory is a red herring here: 3 GB is nothing. Lead with the ops/s and the latency budget.

## 11. Learn more
- [Rate limiting](#/learn/system-design/rate-limiting) and [caching](#/learn/system-design/caching)
- [Consistent hashing](#/learn/system-design/consistent-hashing) (how keys spread over shards)
- [API design](#/topic/system-design/api-design) and [load balancing](#/learn/system-design/load-balancing)
