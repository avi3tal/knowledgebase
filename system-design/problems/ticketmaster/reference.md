# Solution: Ticketmaster (ticket booking)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The inventory is **scarce, unique and contested**. Each seat exists once, and during a big on-sale
about 200 fans want each one. Everything follows from that:
- browsing is an ordinary read-heavy path that can be cached and slightly stale;
- claiming a seat must be an atomic, expiring lease in one source of truth;
- the stampede must be metered *before* it reaches that source of truth;
- payment is a slow, unreliable external call that must not hold locks.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Browse and search events; view an event page |
| F2 | View the seat map with current availability |
| F3 | Hold selected seats for 10 minutes while paying; holds lapse automatically |
| F4 | Pay for held seats and receive a confirmed booking and e-ticket |
| F5 | Hot on-sales go through a waiting room in arrival order |
| N1 | No double booking: each seat is sold at most once |
| N2 | Browse is read-heavy (~100:1), p99 < 200 ms, highly available |
| N3 | Survive ~10M fans for 50k seats within minutes, admitted fairly |
| N4 | A hold expires after 10 minutes with no manual release |
| N5 | Retries never double charge |

**Assumptions:** 10M DAU × 20 page views; ~1M tickets per day; 100k events per year at ~5k seats;
card data stays with the payment provider (PSP). **Out of scope:** resale, dynamic pricing, venue
tools.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| browse | 10M × 20 / 86,400 s | **2,300 /s** (peak ~12k) |
| bookings, normal day | 1M / 86,400 s | **12 /s** |
| on-sale arrivals | 10M fans / 600 s | **17,000 /s** |
| fans per seat | 10M / 50k | **200** |
| on-sale bookings | 50k seats / 600 s | **~80 /s** |
| seat rows per year | 100k × 5k | **500M** |
| seat storage per year | 500M × 200 B | **100 GB** |

The numbers split the problem cleanly. Reads are large but easy to cache. Bookings are tiny, even
at peak: 80 per second. The danger is the **arrival spike**, 17k fans per second competing for a
few thousand rows. That is a contention and fairness problem, not a storage problem: 100 GB a year
fits a sharded, even a single, Postgres.

## 3. API and data model
- `GET /events?q=&city=&from=&to=` → events. Served from the search index and cacheable.
- `GET /events/{id}/seats` → the seat map snapshot, cached for a few seconds.
- `POST /events/{id}/queue` → `{position, eta}` or `{admission_token}`. Join or poll the waiting room.
- `POST /events/{id}/holds {seat_ids}` + admission token → `201 {hold_id, expires_at}` or `409`.
  All or nothing.
- `POST /bookings {hold_id, payment_token}` + `Idempotency-Key` → `202 {booking_id, status: pending}`.
- `POST /webhooks/psp` is the signed payment result, deduplicated by the PSP's event id.

| entity | key fields | store |
|---|---|---|
| `events` | event_id, performer, venue_id, starts_at, on_sale_at | Postgres, indexed into Elasticsearch |
| `seats` | (event_id, seat_id), status available/held/sold, hold_id, held_until, booking_id, version | Postgres, partitioned by event_id |
| `bookings` | booking_id, user_id, seat_ids, amount, status, idempotency_key (unique), psp_payment_id | Postgres, same shard as the seats |
| `outbox` | id, type, payload | Postgres, written in the booking transaction |
| waiting room | ZSET `queue:{event}` scored by arrival time | Redis |

## 4. Decompose: the parts
Four sub-problems with very different shapes: a read path, a contention point, a stampede and an
external call.

### Part P1: Browse and search: the read path (F1, F2, N2)
| option | pros | cons |
|---|---|---|
| query Postgres for everything | one system, always fresh | full-text search and seat maps compete with bookings |
| **search index + CDN/Redis caches, seat map cached for seconds** | scales separately, memory/edge speed | seat map slightly stale; an indexing pipeline |
| push live availability to every viewer | fresh seat maps | fan-out of every seat change to thousands of viewers |

**Choice:** Elasticsearch fed by CDC for search; a CDN and Redis in front of event pages; the seat
map cached for 2–5 seconds. A stale seat map is safe because the hold (P2) is the authoritative
check. At worst a fan clicks a seat that was just taken and gets a 409.

```diagram
part:P1
```

### Part P2: Seat hold without double booking (F3, N1, N4)
| option | pros | cons |
|---|---|---|
| `SELECT … FOR UPDATE` kept open while the fan pays | simple, consistent | locks held for minutes of think time; connection exhaustion |
| Redis `SET NX` with a 10-minute TTL per seat | fast, automatic expiry | a second source of truth; a failover can drop holds |
| **atomic conditional `UPDATE` with `held_until` in Postgres** | one truth, short transactions, all or nothing | every hold is a DB write; a hot event sits on one shard |

**Choice:** a hold is a lease stored in the seat row itself.

```sql
UPDATE seats SET status='held', hold_id=$h, held_until=now()+interval '10 min', version=version+1
WHERE event_id=$e AND seat_id = ANY($seats)
  AND (status='available' OR (status='held' AND held_until < now()));
-- rows updated must equal len($seats), otherwise roll back → 409
```

The transaction lasts milliseconds, and expiry is part of the predicate, so nothing has to release
an abandoned hold. With the waiting room in front, the hold rate is a few hundred per second, which
one primary per event shard handles easily.

```diagram
part:P2
```

### Part P3: Virtual waiting room for on-sales (F5, N3)
| option | pros | cons |
|---|---|---|
| autoscale everything | nothing new | the bottleneck is one event's rows, which don't scale out |
| rate limit with 429 and client retries | cheap | retry storms, rewards bots and refreshers, unfair |
| **virtual queue + admitter issuing signed tokens at N/s** | bounded load, fair, visible position | a stateful component; a token check on every hold |

**Choice:** fans join a Redis sorted set scored by arrival time. They wait on a static page served
from the CDN that polls their position. An admitter pops the next N fans per second and gives each
a signed admission token (for example a JWT with event_id, session and a 15-minute expiry). The
gateway rejects hold and booking calls without a valid token. With 50k seats, admitting ~500 fans
per second sells out in minutes without overloading the seat rows.

```diagram
part:P3
```

### Part P4: Payment and booking confirmation (F4, N1, N5)
| option | pros | cons |
|---|---|---|
| charge synchronously inside the DB transaction | easy to explain | locks held across a 1–3 s network call; a timeout leaves the outcome unknown |
| **pending booking + PSP charge with idempotency key, confirmed by webhook, outbox for tickets** | no locks across the network; safe retries | more states: pending, failed, late success → refund |

**Choice:** `POST /bookings` inserts a pending booking (unique idempotency key) and extends the hold
to cover the payment. It then calls the PSP with the booking id as the PSP idempotency key. The
webhook confirms the booking: in one transaction it flips the seats from `held` by this hold to
`sold` with a conditional update, marks the booking confirmed and writes an outbox row. The relay
publishes `BookingConfirmed`, and the ticket worker issues the e-ticket.

```diagram
part:P4
```

## 5. Reduce: the high-level design
Merge the parts by node id, one problem at a time:

**v1, naive:** one app and one SQL database. Browse traffic and the on-sale stampede land on the
same database, and nothing stops two fans buying the same seat.
```diagram
v1
```
**v2, compose P1 and P2:** a gateway, a cached and indexed read path, and a booking service whose
conditional update makes holds exclusive and self-expiring.
```diagram
v2
```
**v3, compose P3:** the waiting room sits beside the gateway; only admitted fans reach the hold
path.
```diagram
v3
```
**v4, compose P4:** payment through the PSP with idempotency keys and a webhook; confirmed bookings
leave through the outbox to the ticket worker.
```diagram
v4
```

## 6. Deep dives
- **Releasing expired holds.** A sweeper job makes correctness depend on a job's timing, and a
  Redis TTL creates a second source of truth. Lazy expiry (`held_until < now()` in every predicate)
  is exact. Add a sweeper only to tidy rows.
- **Late payment success.** The PSP may confirm after the hold lapsed and the seat was resold. The
  confirming update then touches 0 rows: mark the booking failed and refund automatically. Extending
  the hold while a booking is pending makes this rare.
- **Duplicate webhooks and retries.** Keep a unique idempotency key on bookings, use the booking id
  as the PSP idempotency key, and deduplicate webhooks by PSP event id. A reconciliation job polls
  the PSP for bookings pending more than 5 minutes, in case a webhook was lost.
- **Hot event on one shard.** Sharding seats by seat_id would turn a 4-seat hold into a cross-shard
  transaction. Shard by event_id instead and set the admission rate from what one primary sustains.
- **Seat map under load.** One snapshot per event in Redis, rebuilt every few seconds by a single
  writer, turns 17k reads per second into one query every few seconds.
- **Bots.** Tokens bind to a session; add CAPTCHA at queue entry, per-account limits and verified-fan
  presale codes.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [PostgreSQL](#/topic/system-design/postgresql) | seats, bookings and outbox; holds as conditional updates | MySQL, Spanner/CockroachDB for multi-region |
| [Redis](#/topic/system-design/redis) | event and seat-map cache; the waiting-room sorted set | Memcached (cache only) |
| [Elasticsearch](#/topic/system-design/elasticsearch) | event search by text, city and date | OpenSearch, Postgres full-text at small scale |
| [Kafka](#/topic/system-design/kafka) | change events for indexing and ticket issuing | SQS/SNS, Debezium + any broker |

## 8. Patterns
- [Distributed locks, leases & holds](#/topic/system-design/distributed-locking): a hold is a lease with
  an expiry stored in the row it protects.
- [Optimistic concurrency](#/topic/system-design/optimistic-concurrency): the conditional update is a
  compare-and-set on the seat's status.
- [Backpressure & waiting rooms](#/topic/system-design/backpressure): admission control in front of
  the scarce resource.
- [Idempotency keys](#/topic/system-design/idempotency) and the
  [transactional outbox](#/topic/system-design/outbox-pattern) make payment and ticketing safe to
  retry.
- The transferable shape is **scarce inventory under contention**. Claim with an atomic, expiring
  lease, meter demand before the source of truth, and confirm with an idempotent external payment.
  Flash sales, restaurant reservations, hotel rooms and appointment slots have the same shape.

## 9. Evaluation
- **Bottlenecks:** a hot event's rows on one primary (bounded by the admission rate), the
  waiting-room Redis during arrival, and PSP rate limits.
- **Failures:** if the cache is down, reads fall back to the DB behind the gateway. If the queue
  store is down, admissions pause but sales in flight continue. If the PSP is down, bookings stay
  pending, then holds lapse. A lost webhook is caught by reconciliation.
- **Monitoring:** hold success vs 409 rate, hold → booking conversion, expired holds, pending
  bookings older than 5 min, PSP errors, queue length and admission rate, relay lag, cache hit ratio.
- **The 30-second answer:** browsing is served from Elasticsearch plus CDN and Redis caches. A hold
  is an atomic conditional `UPDATE` on Postgres seat rows with a `held_until` expiry, so no seat is
  held twice and abandoned holds lapse on their own. Hot on-sales go through a Redis-backed virtual
  queue that admits fans at a fixed rate with signed tokens checked at the gateway. Payment is a
  pending booking charged through the PSP with an idempotency key and confirmed by webhook; an outbox
  event issues the ticket.

## 10. Tips and common mistakes
- Don't hold a database lock while the fan types card details. A hold is data (a lease), not a lock.
- "Use a distributed lock" is half an answer. Say where the truth lives and what happens when the
  lock store fails over.
- Don't try to scale the booking path to 17k/s. The inventory is 50k seats, so meter the fans.
- Don't call the PSP inside a transaction, and say what happens on a timeout.
- Separate the two consistency needs out loud: browse can be stale, the sale cannot.

## 11. Learn more
- [Rate limiting](#/learn/system-design/rate-limiting) and [caching](#/learn/system-design/caching)
- [Sharding](#/learn/system-design/sharding) for partitioning seats by event
- [Distributed transactions](#/topic/system-design/distributed-transactions) and
  [CAP and consistency models](#/topic/system-design/cap-consistency)
- [Payment system](#/topic/system-design/payment-system) for the payment side in depth
