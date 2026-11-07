# Solution: live comments

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
It looks like group chat with a bigger group, but the numbers break that model. One stream can
have **5M viewers and 10k comments/s**, which is 5 × 10^10 deliveries/s if every comment goes to
every viewer. Nobody can read that, so the design does three things:
- route per **server**, not per viewer;
- send **batches** on a fixed clock and **sample** when the rate is high;
- write each comment once to a **log** that both storage and delivery read.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Post a short comment (≤ 200 characters) on a live video |
| F2 | Viewers of a live video see new comments in real time |
| F3 | Late joiners see the last ~50 comments at once; comments are kept for replay |
| F4 | Blocked words are filtered; moderators can delete, and the comment disappears from screens |
| N1 | Post → other viewers' screens within 2 s p99 |
| N2 | One video can have 5M viewers and 10k comments/s without slowing other videos |
| N3 | A posted comment is never lost from storage; showing a sample live is acceptable |

**Assumptions:** 20M concurrent viewers over ~100k videos, one comment per viewer per 10 minutes,
~300 B per comment, people read ≤ ~10 comments/s. **Out of scope:** the video pipeline,
reactions/likes, threaded replies.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| comments at peak | 20M / 600 s | **~33k /s** (hot video ≈ 10k /s) |
| naive hot-video deliveries | 5M × 10k | **5 × 10^10 /s**: impossible |
| batched deliveries | 20M viewers × 2 batches/s | **40M /s** |
| egress | 40M × ~2 KB | **~80 GB/s** (CDN-scale, spread over gateways) |
| gateways | 20M / 100k connections | **~200** |
| storage / year | 33k / 3 × 86,400 × 365 × 300 B | **~100 TB** |

What the numbers say: writes are modest, but **reads are a broadcast**. Delivery cost has to be
tied to the number of viewers and a fixed batch rate, never to the comment rate.

## 3. API and data model
- `POST /videos/{id}/comments {client_comment_id, text}` → `201 {comment_id, ts}`, once appended to
  the log.
- `GET /videos/{id}/comments/stream` (Server-Sent Events) → `batch {comments[]}` and
  `delete {comment_id}` events.
- `GET /videos/{id}/comments/recent?limit=50` → the joiner's first screen, CDN-cached for 1 s.
- `DELETE /videos/{id}/comments/{comment_id}` (moderators) → 204, and a tombstone event.

| entity | key and fields | store |
|---|---|---|
| `comments` | (video_id, hour bucket) partition, time-ordered comment_id, user_id, text, status | Cassandra |
| `recent_comments` | video_id → last 50 comments | Redis list |
| subscriptions | gateway memory: video → local connections; pub/sub channel `video:{id}` | Redis pub/sub |

## 4. Decompose: the parts
Four sub-problems: the write path, delivery, the hot stream, and the joiner's first screen.

### Part P1: Comment ingestion and storage (F1, F4, N3)
Accept ~33k comments/s, filter them, and ack only when the comment can't be lost, so that what is
shown and what is stored never disagree.

| option | pros | cons |
|---|---|---|
| SQL, viewers poll it | simple | every poll hits the database; one table takes 33k writes/s |
| write the DB, then publish | durable before shown | a dual write: a crash in between drops the publish or shows unstored comments |
| **log first: append to Kafka by video_id, then consumers** | one durable write; storage and delivery read the same log | storage lags by seconds; a log cluster to run |

**Choice:** the comment service checks the blocklist and appends to Kafka keyed by `video_id`, then
acks. Persister workers batch-insert into Cassandra, and dispatchers (P3) read the same partitions.

```diagram
part:P1
```

### Part P2: Real-time delivery to viewers (F2, N1)
Get comments onto 20M screens on ~200 gateways within 2 s, without per-viewer work on the server.

| option | pros | cons |
|---|---|---|
| poll through the CDN every 2 s | stateless; the CDN collapses requests | ~10M requests/s, mostly empty; latency = interval + TTL |
| per-viewer routing (as in chat) | precise | 5M lookups and sends per comment on a hot video |
| **SSE gateways + pub/sub per video** | one publish per gateway; millisecond push | stateful gateways; subscription churn when viewers switch |

**Choice:** a gateway subscribes once to `video:{id}` for each video its viewers watch, with a
reference count, and writes each batch to its local connections. Fan-out is bounded by the ~200
gateways. Comments only flow to the viewer, so SSE is enough, and posting stays a plain POST.

```diagram
part:P2
```

### Part P3: Hot stream: more comments than anyone can read (F2, N2)
5M viewers × 10k comments/s, when a human reads ~10/s.

| option | pros | cons |
|---|---|---|
| deliver everything | complete | 5 × 10^10 messages/s, unreadable anyway |
| send all, client drops | simple server | the network still carries everything |
| split viewers into rooms | bounded by design | a different product: viewers see different conversations |
| **batch + sample per video every 500 ms** | cost = viewers × 2/s, whatever the comment rate | most comments on a hot stream are never shown live |

**Choice:** one dispatcher per Kafka partition collects a video's comments for 500 ms. If there are
more than ~10, it samples them, keeping streamer, moderator and verified comments first, and
publishes one batch. Quiet videos still get every comment. The poster's own comment is shown
locally by their app.

```diagram
part:P3
```

### Part P4: Recent comments for joiners (F3, N2)
When a big stream starts, ~1M people join within a minute, and every one of them asks for the same
50 comments.

| option | pros | cons |
|---|---|---|
| query `comments` on each join | always correct | ~17k reads/s on one partition |
| Redis list per video | memory-speed | one hot key per big video |
| **Redis list + CDN with a 1 s TTL** | the edge absorbs the herd | a joiner may miss up to a second, which the live stream fills in |

**Choice:** dispatchers run `LPUSH` + `LTRIM 50` on the video's list, and `/recent` is served through
the CDN with a 1-second TTL. Every joiner wants the same answer, so it is ideal to cache.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** one service and one SQL table, with every viewer polling each second: 20M queries/s on
one database.
```diagram
v1
```
**v2, compose P2:** SSE gateways and per-video pub/sub replace polling. The service still writes SQL
then publishes (a dual write), and every comment still goes to every viewer.
```diagram
v2
```
**v3, compose P1 and P3:** the log is the only write. Persisters fill Cassandra while dispatchers
batch and sample.
```diagram
v3
```
**v4, compose P4:** the recent-comments list behind the CDN for joiners.
```diagram
v4
```

## 6. Deep dives
- **Order.** A viewer only sees one video's comments, and the Kafka partition keyed by video already
  orders them. Batches keep offset order, so every screen shows the same sequence. Comment ids are
  time-ordered for replay. A global order would be a bottleneck nobody can see.
- **Moderation.** The blocklist runs in the comment service, so blocked text never enters the log. A
  delete is a tombstone event on the same path: dispatchers publish it, gateways remove the comment
  from screens, the recent list drops it, and persisters mark it deleted. Staleness is bounded by
  the batch interval plus the 1 s CDN TTL.
- **Subscription churn.** Viewers zap between streams constantly. Gateways keep a reference count
  per video and unsubscribe when the last local viewer leaves, so pub/sub never sees individual
  viewers.
- **The hottest partition.** All of one video's comments go through one partition and one
  dispatcher. 10k small messages/s is comfortable for a single consumer. If it ever weren't, split
  the video's key into a few sub-keys and merge in the dispatcher.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [WebSockets / SSE](#/topic/system-design/websockets-sse) | one-way stream of comment batches to each viewer | long polling, WebSocket |
| [Envoy / NGINX](#/topic/system-design/envoy-nginx) | balancing long-lived SSE connections over gateways | cloud L7 LB |
| [Kafka](#/topic/system-design/kafka) | comment log keyed by video_id | Pulsar, Kinesis |
| [Redis](#/topic/system-design/redis) | pub/sub channels per video; recent-50 lists | NATS for pub/sub |
| [Cassandra](#/topic/system-design/cassandra) | comments by (video, hour) for replay | DynamoDB, HBase |

## 8. Patterns
- [Real-time push](#/topic/system-design/real-time-push): gateways hold the connections and the
  server speaks first.
- [Fan-out](#/topic/system-design/fan-out): fan out per gateway through pub/sub, then in memory.
- [Backpressure](#/topic/system-design/backpressure): batching and sampling cap what a viewer
  receives, whatever the write rate.
- [Hot keys](#/topic/system-design/hot-keys): a viral video's recent list and partition.
- The transferable shape is a **broadcast to a huge audience**. Write once to a log, route per
  server rather than per viewer, and make delivery cost depend on audience size and a fixed clock.
  Live sports scores, auction price tickers and stadium-scale polls have the same shape.

## 9. Evaluation
- **Bottlenecks:** gateway egress (~80 GB/s overall), the hot video's single partition and
  dispatcher, and the hot recent key, which the CDN absorbs.
- **Failures:** if a gateway crashes, viewers reconnect with jitter and refetch `/recent`. If a
  dispatcher crashes, another consumer resumes from the committed offset, and a duplicate batch is
  harmless. If pub/sub restarts, gateways resubscribe. If persisters lag, storage catches up and the
  live view is unaffected.
- **Monitoring:** post → screen p99, comments/s and viewers per video, sampling ratio, gateway
  connections and egress, consumer lag (dispatchers and persisters), and the CDN hit ratio for
  `/recent`.
- **The 30-second answer:** posts are filtered and appended to Kafka keyed by video, and acked.
  Persisters write Cassandra. Per-video dispatchers batch every 500 ms, sample to ~10 comments when
  busy, update a recent-50 Redis list, and publish to a Redis pub/sub channel. SSE gateways subscribe
  once per video and fan out to their viewers. Joiners read the recent list through the CDN with a
  1 s TTL.

## 10. Tips and common mistakes
- Don't reuse the chat design unchanged. Per-recipient routing dies at 5M viewers.
- Do the multiplication: viewers × comments/s for the hot video, out loud. It drives the whole design.
- Sampling is a product decision. Get agreement that not every comment has to be shown live.
- Store and show from the same log, so you never have a dual write.
- Joiners all ask the same question, so cache the answer at the edge.

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [caching](#/learn/system-design/caching)
- [CDN](#/topic/system-design/cdn) and [networking basics](#/topic/system-design/networking-basics)
- Smaller audience, stricter delivery: [chat system](#/topic/system-design/chat-system)
