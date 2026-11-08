# Solution: online auction

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The core is **one contested value per auction, the highest bid, with many watchers**. Writes are
modest overall, but they race on a single row at the worst moment (the final minute), and every
accepted write must reach thousands of open screens within a second. Time is also an input: the
auction ends on its own, with no request to trigger it. The design has to keep all three correct
together: the race, the fan-out and the clock.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Sellers create an auction: item, starting price, increment, end time |
| F2 | Place a bid; accepted only if it beats the high bid by the increment while open |
| F3 | Watchers see the highest bid update live |
| F4 | The auction closes at its end time; the winner and seller are notified |
| N1 | Strong consistency per auction: the highest bid is never lost or overwritten by a lower one |
| N2 | An acknowledged bid is never lost; full audit history |
| N3 | Live updates within ~1 s; item pages read-heavy and cached |
| N4 | Close within ~1 s of the end time |
| N5 | 10M active auctions, ~1,200 bids/s peak, ~100 bids/s on one hot auction |

**Assumptions:** 10M bids/day, 1M auctions end per day, 2M concurrent watchers, ~10k on a hot
auction, ~200 B per bid. **Out of scope:** payment, shipping, search ranking, fraud models.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| bids | 10M / 86,400 s | **120 /s** (peak ~1,200) |
| page views | 50M users × 30 / 86,400 s | **17,000 /s** |
| fan-out, one hot auction | 50 bids/s × 10k watchers | **500,000 messages/s** |
| auctions closing | 1M / 86,400 s | **~12 /s** |
| bid history | 10M × 365 × 200 B | **730 GB / year** |

Bids are a small write load: one sharded Postgres handles them easily. Fan-out is where the volume
is, at hundreds of thousands of messages per second for a single auction. That calls for push, not
polling. Closing is only ~12 auctions per second, so a 1-second poll of an index is cheap.

## 3. API and data model
- `POST /auctions {item, start_price, increment, ends_at}` → `201 {auction_id}`
- `GET /auctions/{id}` → item, high bid, bid count, end time. Cached.
- `POST /auctions/{id}/bids {amount}` + `Idempotency-Key` → `201 {bid_id, high_bid}`, `409
  {current_high_bid}` if outbid, `410` if closed.
- `GET /auctions/{id}/stream` → SSE events `{high_bid, bid_count, ends_at, status}`.

| entity | key fields | store |
|---|---|---|
| `auctions` | auction_id, status, ends_at (indexed), increment, high_bid, high_bidder, version | Postgres, sharded by auction_id |
| `bids` | bid_id, auction_id, bidder_id, amount, status, idempotency_key (unique) | Postgres, same shard, append-only |
| `outbox` | id, auction_id, type, payload | Postgres, same transaction |
| bid archive | partitioned files of bid events | S3 |

## 4. Decompose: the parts
There are four sub-problems: a write race, a fan-out, a timer and an audit trail.

### Part P1: Bid placement under concurrency (F2, N1, N2)
| option | pros | cons |
|---|---|---|
| read the high bid, compare in the app, write | trivial | lost updates: two bidders both "beat" $100 |
| `SELECT … FOR UPDATE` on the auction row | obviously correct | bids queue on the lock |
| **conditional `UPDATE` on high_bid (compare-and-set)** | one short statement; losers learn the new price at once | a very hot auction contends on one row |
| serialize per auction through a partitioned log | no contention; scales the hottest auction | asynchronous acceptance; more moving parts |

**Choice:** one statement decides.

```sql
UPDATE auctions SET high_bid=$amt, high_bidder=$u, version=version+1
WHERE auction_id=$a AND status='open' AND now() < ends_at AND $amt >= high_bid + increment;
-- 1 row → INSERT bid (accepted) + outbox row, COMMIT; 0 rows → 409 with the current high bid
```

There is no read-modify-write window, so there is nothing to retry. The bid row and the outbox row
commit in the same transaction, which makes the history and the high bid agree by construction.

```diagram
part:P1
```

### Part P2: Real-time fan-out to watchers (F3, N3)
| option | pros | cons |
|---|---|---|
| clients poll every second | stateless | 2M requests/s, almost all "no change" |
| long polling | works everywhere | a reconnect per update |
| **push over SSE/WebSockets + a pub/sub channel per auction** | one message per update per watcher | stateful connection tier |

**Choice:** push servers hold the SSE connections and subscribe to the Redis Pub/Sub channel
`auction:{id}` for each auction their clients watch. A fan-out publisher reads committed
`BidPlaced` events from Kafka (fed by the outbox) and publishes them to the channel. Watchers only
ever see committed bids, and each push server receives only the auctions it needs.

```diagram
part:P2
```

### Part P3: Closing auctions on time (F4, N4)
| option | pros | cons |
|---|---|---|
| cron scan every minute | simple | up to a minute late; the scan grows |
| a timer or delayed message per auction | precise | millions of timers to keep in sync with edits |
| **end enforced by the bid predicate; scheduler polls the `ends_at` index every second; closer finalises** | correctness independent of the timer | finalisation can lag a second under load |

**Choice:** the `now() < ends_at` term in the bid update is what rejects late bids. The scheduler
only triggers bookkeeping: every second it reads auctions due by `ends_at`, and a closer worker marks
each one closed (idempotent), records the winner and writes an `AuctionClosed` outbox row. The
notifier tells the winner and the seller.

```diagram
part:P3
```

### Part P4: Durable bid history and audit (N2)
| option | pros | cons |
|---|---|---|
| keep only the current high bid | tiny | no history; disputes can't be settled |
| **append-only bids table in the same transaction + archive to object storage** | history matches the result; the hot DB stays small | an archiving pipeline |

**Choice:** a bid is acknowledged only after a synchronous-replica commit. An archiver copies the
event stream into S3 files partitioned by date, and closed auctions' bids can later leave the hot
database.

```diagram
part:P4
```

## 5. Reduce: the high-level design
Merge the parts by node id, one problem at a time:

**v1, naive:** one app and one SQL database; watchers refresh the page. Bids race on
read-then-write, and polling floods the database.
```diagram
v1
```
**v2, compose P1:** a load balancer, a cached read path for item pages, and the bid service with
its conditional update.
```diagram
v2
```
**v3, compose P2:** outbox → Kafka → publisher → Pub/Sub → push servers → watchers.
```diagram
v3
```
**v4, compose P3 and P4:** the close scheduler and closer, the notifier, and the audit archive.
```diagram
v4
```

## 6. Deep dives
- **Sniping and whose clock decides.** If the closer's clock decided, results would depend on job
  timing. Use the database clock inside the bid's own update. That is one clock in one statement,
  and the closer can't change an outcome. A *soft close* (a bid in the last 2 minutes extends
  `ends_at` by 2 minutes) is a product choice that removes the sniping advantage. It still works,
  because `ends_at` is part of the same row.
- **One very hot auction.** Row CAS handles hundreds of short updates per second on one row. Beyond
  ~500/s, route that auction's bids to a Kafka partition with a single writer. The writer applies
  them in order and the client waits for a result event. Keep it as an escape hatch, not the default.
- **Reconnecting watchers.** Pub/Sub is fire-and-forget. On connect, send a snapshot from the cache,
  then deltas. SSE `Last-Event-ID` lets the client say what it saw last.
- **Retries.** The `Idempotency-Key` is unique in `bids`. A retried bid returns the original result
  instead of bidding twice.
- **Proxy bidding** (a hidden maximum that bids for you) is still one conditional update: compute
  the new high bid from both maxima in the same statement.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [PostgreSQL](#/topic/system-design/postgresql) | auctions, bids, outbox; conditional updates | MySQL, DynamoDB conditional writes |
| [Redis](#/topic/system-design/redis) | item page cache; Pub/Sub channel per auction | NATS, a managed pub/sub |
| [Kafka](#/topic/system-design/kafka) | committed bid and close events | Kinesis, Pulsar |
| [WebSockets / SSE](#/topic/system-design/websockets-sse) | live price to watchers | long polling as a fallback |
| [Object storage](#/topic/system-design/object-storage) | long-term bid audit archive | a data warehouse |

## 8. Patterns
- [Optimistic concurrency](#/topic/system-design/optimistic-concurrency): the bid is a compare-and-set
  on the high bid.
- [Real-time push & pub/sub](#/topic/system-design/real-time-push) and
  [fan-out](#/topic/system-design/fan-out) for watchers.
- [Transactional outbox](#/topic/system-design/outbox-pattern): publish only committed bids.
- [Hot keys](#/topic/system-design/hot-keys): one celebrity auction concentrates writes and channel
  traffic.
- The transferable shape is a **contended value with many watchers**. Make every write conditional
  in one source of truth, record it append-only in the same transaction, then fan the committed
  change out asynchronously. Guard time-based transitions in the write path itself, not with a
  timer. Live sports scores with betting, stock limit orders and seat counters share it.

## 9. Evaluation
- **Bottlenecks:** the hottest auction's row, the Pub/Sub node and push servers for a 10k-watcher
  channel, and the closer when many auctions share a popular end time.
- **Failures:** if Pub/Sub or a push server is down, watchers reconnect and get a snapshot; bids are
  unaffected. Relay lag delays live updates and notifications, never correctness. If the closer is
  down, auctions look open longer, but no late bid can win.
- **Monitoring:** bid p99 and 409/410 rates, relay lag, bid → watcher delivery lag, connections per
  push server, auctions overdue to close.
- **The 30-second answer:** a bid is one conditional `UPDATE` on the auction row (`amount ≥ high_bid
  + increment AND now() < ends_at`). It commits with an append-only bid row and an outbox row. The
  outbox feeds Kafka, a publisher pushes committed bids into a Redis Pub/Sub channel per auction,
  and push servers deliver them over SSE. A scheduler polls the `ends_at` index every second to
  finalise and notify, but the bid predicate is what rejects late bids. The bid history is archived
  to S3 for audits.

## 10. Tips and common mistakes
- "Read the max, compare, write" is the classic lost-update bug. Name it and fix it with a
  conditional write.
- Don't let a cron job decide who won. The end time belongs in the bid's own predicate.
- Don't poll for live prices at this scale. Do the arithmetic: 2M watchers × 1/s.
- Publish after commit (outbox), or watchers will see bids that were rolled back.
- Say which clock you trust, and why.

## 11. Learn more
- [Message queues and event streaming](#/learn/system-design/message-queues)
- [Sharding](#/learn/system-design/sharding) for partitioning auctions by id
- [CAP and consistency models](#/topic/system-design/cap-consistency)
- [Distributed job scheduler](#/design/system-design/job-scheduler) for the timer side in depth
- [Live comments](#/design/system-design/live-comments), the same fan-out shape without the race
