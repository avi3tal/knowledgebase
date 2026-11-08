# Solution: Uber (ride hailing)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Two very different kinds of data share one product:
- **Driver positions** arrive at a huge rate (~250k/s) and are worthless after a few seconds. They
  want memory, overwrites and spatial search, not durability.
- **Drivers are a scarce resource.** A driver must never be assigned two rides at once, so dispatch
  needs a small amount of strong consistency.

Payments then add the usual "charge exactly once against an unreliable provider" problem.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Riders see nearby available drivers on a map with an ETA |
| F2 | A rider requests a ride; a nearby available driver is matched and accepts |
| F3 | Drivers report GPS every ~4 s; riders track their driver live |
| F4 | Trip lifecycle (accepted → arriving → in progress → completed / cancelled); charge after the trip |
| N1 | ~250k location updates/s at peak; positions used for matching are at most a few seconds old |
| N2 | Nearby search p99 < 100 ms; the offer reaches a driver within ~5 s |
| N3 | A driver is never on two rides; a ride never has two drivers |
| N4 | Ride requests and trip state are 99.99% available and durable; each trip is charged exactly once |

**Assumptions:** 1M drivers online at peak, 20M trips/day, trips are local to a city, and an offer
expires after 15 s. **Out of scope:** surge pricing, ETA models, pooled rides, onboarding.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| location updates | 1M drivers / 4 s | **250,000 /s** |
| ingest bandwidth | 250k/s × 200 B | **50 MB/s** |
| live position set | 1M × 100 B | **100 MB** |
| ride requests | 20M / 86,400 s | **230 /s** (peak ~700) |
| trip storage | 20M/day × 365 × 2 KB | **~15 TB / year** |

What the numbers say:
- The live position set is tiny (100 MB), so memory is not the problem. The **write rate** is: 250k
  overwrites per second.
- Ride requests are a thousand times rarer than location updates. Dispatch can afford a lock and a
  database transaction; location ingestion cannot.

## 3. API and data model
- `POST /drivers/location {lat, lng, heading, ts}` → `204`. Sent over the driver's WebSocket; the
  latest write wins.
- `GET /drivers/nearby?lat&lng&radius` → pins and ETAs, served from the geo index.
- `POST /rides {pickup, dropoff, payment_method}` with an `Idempotency-Key` → `201 {ride_id, status: matching}`.
- `POST /rides/{id}/accept {driver_id, offer_id}` → `200`, or `409` if the offer expired or was taken.
- `PATCH /rides/{id} {status}` moves the state machine; illegal transitions → `409`.

| entity | fields | store |
|---|---|---|
| `driver_locations` | city → GEO set of driver_id → (lat, lng) | Redis GEO, overwritten every 4 s |
| `driver_state` | driver_id, state, ride_id, lease TTL | Redis |
| `rides` | ride_id, city, rider_id, driver_id, pickup, dropoff, status, fare, timestamps; partial unique index on driver_id for active statuses | Postgres, sharded by city |
| `outbox` | event_id, ride_id, type, payload | same Postgres transaction as `rides` |

## 4. Decompose: the parts
Four sub-problems, each with its own hard requirement.

### Part P1: Driver location ingestion (F3, N1)
Absorb 250k updates/s, keep only the latest position, and stream positions to riders who are
watching a trip.

| option | pros | cons |
|---|---|---|
| write each update to the SQL rides database | one store, durable | 250k overwrites/s of data that is stale in 4 s; index churn and replica lag |
| Kafka first, a consumer updates the index | buffers spikes, replayable | an extra hop and seconds of lag exactly where freshness matters |
| **overwrite an in-memory geo index, append to a stream on the side** | memory-speed writes, ~1 s freshness; tracking hangs off the stream | positions vanish if a node dies (they return within 4 s) |

**Choice:** a location service behind the gateway does `GEOADD` into Redis (one key per city shard)
and appends the update to a Kafka location stream. The push gateway reads the stream for drivers on
active trips and forwards positions to their riders. Durability is cheap to give up here: a lost
shard refills itself within one update interval.

```diagram
part:P1
```

### Part P2: Nearby-driver search (F1, F2, N2)
Find the available drivers within a few km of a point, in < 100 ms, while every position changes
every 4 s.

| option | pros | cons |
|---|---|---|
| SQL range on lat and lng | no new technology | a B-tree indexes one dimension, so a box query scans a whole latitude stripe |
| **geohash cells in Redis GEO** | `GEOSEARCH` built in, cheap overwrites, O(log n + k) | square cells distort near the poles; you search neighbouring cells |
| in-memory quadtree per region | adapts to density | rebalancing under 250k moves/s; custom code |
| H3 hexagons or S2 cells | uniform neighbours, good for surge and ETA by cell | a custom index service to build and run |

**Choice:** Redis GEO per city. `GEOSEARCH` a 2 km radius, drop drivers who aren't available, and
widen the ring if fewer than ~10 remain. Rank the candidates by ETA, not straight-line distance. H3 is
the upgrade path once surge pricing needs equal-area cells.

```diagram
part:P2
```

### Part P3: Matching and dispatch: one driver, one ride (F2, N3)
Concurrent requests in the same area all see the same nearest driver. Each driver must get one offer
at a time, and an ignored offer must free the driver after 15 s.

| option | pros | cons |
|---|---|---|
| broadcast to several drivers, first accept wins | fast | spams drivers; still needs an atomic accept |
| lock the driver row in SQL for the offer window | strong | a database lock held for 15 s on the hot path |
| **per-driver lease with TTL + conditional write on accept** | short, self-expiring, no DB lock | expiry and a late accept can race, so accept must be conditional |
| one single-threaded dispatcher per city | no locks; can batch-match | hot partition in big cities; failover pauses dispatch |

**Choice:** the matcher takes a lease with `SET driver:{id} {ride_id} NX PX 15000`. If that fails, it
tries the next candidate. It then sends one offer through the push gateway. Accept has to win twice:
1. **The lease still names this ride.** An atomic compare-and-set (a small Lua script) turns
   `driver:{id} = ride_id` into `on_trip`. A late accept for an expired offer, after the driver was
   leased for another ride, fails here and gets `409`.
2. **The ride is still unassigned.** `UPDATE rides SET driver_id = …, status = 'accepted' WHERE id = …
   AND status = 'matching'`. A partial unique index on `rides(driver_id)` for active statuses is the
   last line of defence. A driver's rides live in one city shard, so the database can enforce it.

The conditional update gives a ride one driver. The lease check plus the unique index give a driver
one ride. Both halves of N3 are needed.

```diagram
part:P3
```

### Part P4: Trip state and payments handoff (F4, N4)
Run each trip through a durable state machine and charge exactly once, even when the payment provider
is slow.

| option | pros | cons |
|---|---|---|
| charge inside the "complete trip" request | simple | PSP outages block drivers; a retry after a timeout can double-charge |
| distributed transaction across trips and payments | atomic on paper | the PSP doesn't take part in 2PC |
| **outbox + payment worker with an idempotency key** | trip flow never waits; retries are safe | the charge lands seconds later; needs reconciliation |

**Choice:** the transition to `completed` and an outbox row commit in one transaction. A relay
publishes the event to Kafka, and a payment worker charges with `Idempotency-Key = ride_id`.

```diagram
part:P4
```

## 5. Reduce: the high-level design
Merge the parts by node id, one problem at a time.

**v1, naive:** one ride service and one SQL database holding rides and driver coordinates. It
breaks on N1 (250k writes/s into SQL) and N2 (lat/lng range scans), and nothing stops double
assignment.
```diagram
v1
```
**v2, compose P1 and P2:** a gateway, the location service writing into Redis GEO per city, the
location stream feeding live tracking, and a matching service that searches by radius.
```diagram
v2
```
**v3, compose P3:** driver leases, offers through the push gateway, and a conditional update on
accept.
```diagram
v3
```
**v4, compose P4:** the trip outbox, a trip-event stream and a payment worker that talks to the PSP.
```diagram
v4
```

## 6. Deep dives
- **Sharding and hot cities.** Partition the geo index, matching and the rides database by city.
  Rides almost never cross cities. Megacities get several shards keyed by geohash prefix. Near a shard
  border, search both shards and merge.
- **Ignored or late offers.** The lease's 15 s TTL frees the driver without any cleanup job. After
  about three failed rounds, tell the rider no driver was found. A late accept fails the lease check
  because the lease is gone or names another ride. It gets `409`, and the app shows "offer expired".
  Without that check, a driver re-leased for ride B could still win the expired ride A.
- **Driver state drift.** A driver can go offline without saying so. Expire drivers with no update in
  ~30 s, either with a per-driver timestamp that the search filters on, or with a sweeper that removes
  them from the GEO set.
- **Idempotent ride creation.** A rider tapping twice on a flaky network must not create two rides.
  `POST /rides` stores the `Idempotency-Key` with the ride and returns the existing one on retry.
- **Live tracking fan-out.** Only drivers on an active trip need forwarding. The push gateway
  consumes the location stream, keeps `driver_id → rider connection`, and drops everything else.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Redis](#/topic/system-design/redis) | GEO index of live positions per city; driver leases with TTL | in-memory quadtree or H3 index service, Tile38 |
| [Kafka](#/topic/system-design/kafka) | location stream (tracking, trip routes) and trip events | Kinesis, Pulsar |
| [PostgreSQL](#/topic/system-design/postgresql) | `rides` state machine with conditional updates; transactional outbox | MySQL, CockroachDB/Spanner for multi-region |
| [WebSockets](#/topic/system-design/websockets-sse) | driver location uplink; offers and live positions downlink | MQTT, mobile push for background apps |

## 8. Patterns
- [Geo-indexing](#/topic/system-design/geo-indexing): geohash/H3/quadtree cells turn a 2-D "near me"
  query into a few key lookups.
- [Distributed locking](#/topic/system-design/distributed-locking) and
  [optimistic concurrency](#/topic/system-design/optimistic-concurrency): a lease with TTL to
  reserve, a conditional write to commit.
- [Real-time push](#/topic/system-design/real-time-push): offers and live positions over held
  connections.
- [Outbox](#/topic/system-design/outbox-pattern) and [idempotency](#/topic/system-design/idempotency):
  trip completion becomes exactly one charge.
- The transferable shape is **fast ephemeral state + a scarce resource**. Keep the ephemeral state in
  memory with last-write-wins, and guard the scarce resource with a short lease and a conditional
  write. Food delivery, scooter rental and ticket holds have the same shape.

## 9. Evaluation
- **Bottlenecks:** location ingestion and matching in megacities (shard by city and geohash prefix),
  and the push gateway's millions of open connections (scale out, route by driver).
- **Failures:** a Redis shard fails over to a replica and positions refill within 4 s. A PSP outage
  queues charges in Kafka, and retries reuse the idempotency key. A dropped WebSocket reconnects and
  resyncs with `GET /rides/{id}`.
- **Monitoring:** location update lag, drivers per city shard, time to match (p50/p99), offer accept
  rate, lease expiries, unmatched requests, outbox relay lag and payment failure rate.
- **The 30-second answer:** drivers stream GPS every 4 s over WebSockets to a location service. It
  overwrites a Redis GEO index sharded by city and appends to Kafka for live tracking. A ride request
  goes to a matcher that runs `GEOSEARCH`, ranks by ETA, leases one driver with a 15 s TTL and pushes
  the offer. Accept must still hold the lease and wins through a conditional update in Postgres, with a unique
  index on the driver's active ride, so neither side can be double-assigned. Trip
  completion commits with an outbox event, and a payment worker charges the PSP idempotently.

## 10. Tips and common mistakes
- Don't put driver positions in the transactional database. Say the 250k/s number out loud first.
- "Use a geohash" is half an answer. Explain the neighbour-cell search and the ring expansion.
- A distributed lock alone isn't enough: leases expire. Check the lease on accept and pair it with a
  conditional write. Ask yourself both questions: one driver per ride, *and* one ride per driver.
- Separate the two paths explicitly: the location path is write-heavy and loss-tolerant, while the
  dispatch path is low-rate and must be correct.
- Never charge the card inside the trip-completion request.

## 11. Learn more
- [Proximity service](#/topic/system-design/geo-indexing) and [geo-indexing](#/topic/system-design/geo-indexing)
- [Sharding](#/learn/system-design/sharding) and [caching](#/learn/system-design/caching)
- [Distributed transactions](#/topic/system-design/distributed-transactions) and [distributed locking](#/topic/system-design/distributed-locking)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
