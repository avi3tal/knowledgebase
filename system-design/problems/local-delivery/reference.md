# Solution: local delivery (Gopuff)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
**Inventory is local, and the promise is geographic.** A product is only "available" if a
warehouse within 30 minutes of the customer has it. The two sides of the problem pull in opposite
directions:
- reads are huge, ~1,000 per order, and can be slightly stale;
- orders are few but must never oversell.

All the stock fits in memory (~250 MB), so the read side becomes a cache problem, and the write
side becomes a single-shard transaction per warehouse. Drivers add a third, real-time location
problem.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Show items available for delivery to the customer's address |
| F2 | Place an order for a cart and pay; one warehouse fulfils it |
| F3 | Dispatch: assign each order to a driver |
| F4 | ETA at checkout and live tracking |
| N1 | No overselling: confirm only if every item is in stock at the warehouse |
| N2 | Availability p99 < 100 ms; ~1,000 reads per order |
| N3 | ~30-minute delivery: only warehouses within ~30 min travel serve an address |
| N4 | Browsing stays up even if ordering is degraded |

**Assumptions:** 500 warehouses × 5k SKUs, 10M DAU × 20 views, 500k orders/day, 20k drivers pinging
every 5 s. **Out of scope:** replenishment, pricing, payroll.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| availability reads | 10M × 20 / 86,400 s | **2,300 /s** (peak ~12k) |
| orders | 500k / 86,400 s | **6 /s** (peak ~30) |
| inventory rows | 500 × 5,000 | **2.5M** |
| inventory size | 2.5M × 100 B | **250 MB** |
| driver location updates | 20k / 5 s | **4,000 /s** |

Two conclusions follow. All inventory fits in one Redis instance's memory, so reads never need the
database. Order volume is tiny, so a plain Postgres transaction per order is enough. Correctness
under races matters far more than throughput.

## 3. API and data model
- `GET /availability?lat=&lng=&category=` → serving warehouses and items with `in_stock`, from Redis.
- `POST /orders {lines, address, payment_token}` + `Idempotency-Key` → `201 {order_id, warehouse_id,
  eta}` or `409 {out_of_stock}`.
- `GET /orders/{id}/track` → status, driver position, ETA (polled every ~10 s).
- `POST /drivers/{id}/location {lat, lng, ts}` every 5 s; `POST /drivers/{id}/jobs/{order}/accept`.

| entity | key fields | store |
|---|---|---|
| `inventory` | (warehouse_id, sku), qty, version | Postgres, sharded by warehouse |
| `orders` | order_id, warehouse_id, lines, status, driver_id, idempotency_key | Postgres, same shard |
| service areas | geohash cell → [warehouse_id, minutes] | Redis |
| stock cache | `stock:{warehouse}` hash sku → qty | Redis, fed by CDC |
| driver positions | GEO set per city, status with TTL | Redis |

## 4. Decompose: the parts
Four sub-problems: a geo + read problem, a write race, a matching problem and an estimate.

### Part P1: Nearby availability (F1, N2, N3)
| option | pros | cons |
|---|---|---|
| per request: distance to every warehouse + stock from Postgres | fresh, simple | ignores roads; every view hits the DB |
| **precomputed service areas per geohash cell + CDC-fed Redis stock** | O(1) geo lookup, memory-speed stock | ~1 s stale; isochrones to rebuild |
| push every stock change to open apps | very fresh | huge fan-out for no correctness gain |

**Choice:** an offline job asks a routing API for each warehouse's 30-minute isochrone. It writes
`geohash6 cell → warehouses` into Redis. A request maps lat/lng to its cell, gets 1–3 warehouses,
and reads their stock hashes from Redis. Changes flow from Postgres through CDC to Kafka to a cache
updater.

```diagram
part:P1
```

### Part P2: Order placement without overselling (F2, N1)
| option | pros | cons |
|---|---|---|
| check stock, then decrement in the app | simple | race: both customers buy the last unit |
| Redis `DECR` as the source of truth | very fast | a second truth; multi-line carts aren't atomic |
| **one Postgres transaction: conditional decrement per line + the order** | atomic across lines, durable | a hot SKU contends on one row |

**Choice:** pick the closest serving warehouse that has the whole cart. Then, on its shard:

```sql
BEGIN;
UPDATE inventory SET qty = qty - $n, version = version + 1
WHERE warehouse_id = $w AND sku = $s AND qty >= $n;   -- for each line; 0 rows → ROLLBACK → 409
INSERT INTO orders (..., status) VALUES (..., 'pending_payment');
COMMIT;
```

Then authorize the card. On a decline, run a compensating increment and cancel the order.

```diagram
part:P2
```

### Part P3: Dispatch and driver assignment (F3, N3)
| option | pros | cons |
|---|---|---|
| drivers poll and grab jobs | no dispatcher | races, unfair, no optimisation |
| greedy nearest idle driver at order time | instant | assigns before packing; no batching |
| **batched matching per warehouse every ~15 s over a live location index** | uses pack time, returning drivers, two-order trips | up to one batch interval of delay |

**Choice:** drivers' GPS goes into a Redis GEO set, with a TTL so silent drivers drop out. The
dispatcher consumes `OrderConfirmed` events. Every ~15 s per warehouse, it matches orders that will
be packed soon to drivers who are idle there or returning. The cost includes pickup time and lateness
against the promise. It sends the offer by push, re-offering after a timeout.

```diagram
part:P3
```

### Part P4: ETA and order tracking (F4, N3)
| option | pros | cons |
|---|---|---|
| static ETA from straight-line distance | free | wrong in traffic and on busy evenings |
| **measured pack time per warehouse + routing-API travel time; app polls** | accurate, simple | a maps API dependency |

**Choice:** ETA = recent pack time at that warehouse + travel time from the routing API. It is
recomputed when the driver moves and cached per order. Polling every ~10 s is enough for a map that
updates every 5 s.

```diagram
part:P4
```

## 5. Reduce: the high-level design
Merge the parts by node id, one problem at a time:

**v1, naive:** one app and one SQL database. Every view computes distances and reads stock from the
database, and checkout does check-then-decrement.
```diagram
v1
```
**v2, compose P1 and P2:** service areas and stock served from Redis; orders use a conditional
decrement in one warehouse-shard transaction.
```diagram
v2
```
**v3, compose P3:** driver locations in Redis GEO, and the dispatcher fed by order events.
```diagram
v3
```
**v4, compose P4:** the tracking/ETA service on top of driver positions and the routing API.
```diagram
v4
```

## 6. Deep dives
- **Payment after decrement.** Decrementing first means a customer never pays for something out of
  stock. Holding a unit through a few seconds of authorization is cheap. A sweeper releases
  `pending_payment` orders older than 10 minutes, and the card is captured only after packing.
  This is a small saga: decrement → authorize → (on failure) increment.
- **Staleness.** The cache trails the DB by about a second. That's fine because the conditional
  decrement is the real check. Show "only a few left" below a threshold, so a 409 on the last unit
  isn't a surprise.
- **Carts no single warehouse can fill.** Splitting means two drivers and two ETAs. Prefer the
  closest warehouse with the whole cart, and otherwise suggest substitutes.
- **Hot SKUs.** A viral product contends on one row in one warehouse. At ~30 orders/s total that's
  still fine. If needed, split the stock into a few sub-rows (bins) and decrement any one with
  enough quantity.
- **Service areas move.** Rebuild isochrones nightly and when a warehouse opens, and shrink an
  area temporarily when drivers are scarce. That is a write to the geo cache, with no code change.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [PostgreSQL](#/topic/system-design/postgresql) | inventory and orders, sharded by warehouse | MySQL, DynamoDB conditional writes |
| [Redis](#/topic/system-design/redis) | service areas, stock cache, GEO index of drivers | Memcached (cache only), Tile38 for geo |
| [Kafka](#/topic/system-design/kafka) | CDC stock changes and order events | Debezium + any broker, Kinesis |

## 8. Patterns
- [Geospatial indexing](#/topic/system-design/geo-indexing): geohash cells for service areas and a GEO
  set for drivers.
- [CQRS & materialised views](#/topic/system-design/cqrs): a CDC-fed read model for availability,
  separate from the write model that takes orders.
- [Optimistic concurrency](#/topic/system-design/optimistic-concurrency): the conditional decrement.
- [Transactional outbox](#/topic/system-design/outbox-pattern) / CDC so stock and order events are
  never lost.
- The transferable shape is **local inventory under a geographic promise**. Precompute who can serve
  a place, serve reads from an in-memory copy, decrement in one shard per location, and match
  couriers in batches over a live location index. Food delivery, pharmacy delivery and click &
  collect share it.

## 9. Evaluation
- **Bottlenecks:** drivers at a busy warehouse (the real constraint: lengthen ETAs or pause
  ordering), hot SKUs, the Redis cache, and the routing API quota.
- **Failures:** if Redis is down, availability falls back to read replicas behind a rate limit while
  orders keep using the primary. If the relay lags, cache and dispatch lag but orders stay correct.
  If the dispatcher is down, orders queue in Kafka. If the maps API is down, ETAs fall back to
  distance.
- **Monitoring:** availability p99 and cache lag, 409 rate at checkout, stale pending orders,
  order → assignment time, ETA error, on-time %, idle vs busy drivers per warehouse.
- **The 30-second answer:** precompute which warehouses can reach each geohash cell within 30
  minutes, and serve availability from a CDC-fed Redis copy of all stock (250 MB). Place an order
  as one Postgres transaction on the warehouse's shard: a conditional decrement (`qty >= n`) per
  line plus the order, with payment compensation if the card fails. Drivers report GPS into Redis
  GEO, and a dispatcher matches confirmed orders to drivers in 15-second batches per warehouse. ETA
  = measured pack time + routing travel time.

## 10. Tips and common mistakes
- Compute the inventory size early. Once you see it fits in memory, the read path is easy.
- Straight-line radius is not a delivery promise. Say travel time and isochrones.
- Don't make Redis the source of truth for stock, and never check-then-decrement.
- Don't over-engineer the write path for 30 orders/s. Spend the time on correctness and dispatch.
- Assigning a driver at order time looks fast but wastes drivers while the bag is still being packed.

## 11. Learn more
- [Caching](#/learn/system-design/caching) and [sharding](#/learn/system-design/sharding)
- [Proximity service](#/topic/system-design/proximity-service) and
  [ride hailing](#/topic/system-design/ride-hailing) for geo indexes and matching in depth
- [Distributed transactions](#/topic/system-design/distributed-transactions)
- [Ticket booking](#/topic/system-design/ticket-booking): the same no-oversell problem with unique seats
