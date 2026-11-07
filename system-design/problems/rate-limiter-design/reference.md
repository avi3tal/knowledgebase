# Reference walkthrough: rate limiter

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
One functional core: **judge every request** against the caller's limits and reject the excess
with a **429 and a retry hint**. Limits are **rules** (user / API key / IP × endpoint) that change
at runtime. The non-functional side decides the design: the check runs on every request, so it
must be **cheap (< 5 ms p99)**; limits must hold **across the fleet**, not per server; and the
limiter must **not take the API down** with it, except where security says otherwise (login).

## 2. Estimates
Peak **300k requests/s**; with ~2 matching rules that is ~600k counter operations/s. State is tiny:
10M clients × 3 rules × ~100 B ≈ **3 GB**, so it lives in memory. At ~100k ops/s per in-memory node
that is ~6 primaries, **~12 nodes** with replicas. The numbers say: memory is easy, operation rate
and latency are what matter.

## 3. API and data
Internally, a `check(key, rule, cost)` call returning `{allowed, remaining, reset_at}` (usually a
library inside the gateway, not a separate hop). Publicly, throttled callers get
`429 Too Many Requests` plus `Retry-After` and `X-RateLimit-*` headers. Data: a **bucket** per
rule+client (two numbers and a TTL) in an in-memory store, and a small **rules** table in SQL.

## 4. Evolving the design
- **v1:** each API server counts in its own memory. Behind a load balancer of 40 servers a user
  gets up to 40× the quota, restarts wipe counts, and every team re-implements it.
- **v2:** one **choke point** (API gateway) and **shared token buckets in Redis**, updated by an
  atomic script in a single round trip. Limits are now fleet-wide.
- **v3:** rules become data (rules service + DB, cached in gateways); gateways scale behind a load
  balancer; Redis is sharded with replicas; a **failure mode per rule** (open with a local fallback,
  closed for login); decisions are streamed off the hot path for metrics.

## 5. Deep dives
- **Algorithm.** Fixed windows let a client send double the limit across a boundary; a sliding log
  is exact but stores a timestamp per request; a **token bucket** keeps two numbers, expresses
  "rate + burst" directly and refills lazily from the last timestamp. Sliding-window counters are a
  fine alternative when bursts must be smoother.
- **Races.** Read-then-write from two gateways double-admits. Distributed locks add a round trip.
  An **atomic server-side script** lets the shard serialise refill + take.
- **Failure mode.** Fail closed turns a Redis blip into an API outage; fail open removes all
  protection. Fail open **to a coarse local limit** (limit / number of gateways) with a tight
  timeout, and fail closed for rules marked sensitive.

## 6. Wrap-up
Hot keys (one abusive client on one shard) are the main bottleneck: split or pre-check locally.
On shard loss a replica takes over and a few counts reset, which is acceptable. Watch decision
latency, store timeouts, fail-open counts and 429 rate per rule. At 10×, add gateways and shards
and hand out small token batches to gateways to save round trips.

## Transferable pattern
**Shared-counter admission control:** decide at one choke point, keep the state in a fast shared
store updated atomically, choose an algorithm whose memory and burst behaviour fit the limit, and
decide up front how to degrade when the shared state is gone. The same shape appears in quota
systems, concurrency limits, ticket/seat holds and anti-fraud velocity checks.
