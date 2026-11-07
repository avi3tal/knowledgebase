# Solution: notification system

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The hard limits are **not your own hardware**. They are slow, throttled, unreliable third parties
(Apple, Google, SMS and email vendors), and two kinds of traffic that must not hurt each other: a
login code that has seconds, and a 50-million-user campaign that has minutes. The design follows
from that:
- accept fast at one policy gate;
- isolate traffic by channel and urgency;
- let workers own retries, idempotency and each provider's rate limit.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Deliver by mobile push (iOS/Android), SMS and email |
| F2 | Internal services send to a user from a template, now or scheduled; campaigns target a segment |
| F3 | Users opt out per category and channel; marketing capped per user per day; suppressions recorded |
| F4 | Producers look up a notification's status (queued, sent, failed, suppressed) for 30 days |
| N1 | Accepted means never lost (at-least-once to the provider); duplicates suppressed |
| N2 | Transactional messages reach the provider within ~5 s p99, even during campaigns |
| N3 | One slow or failing provider doesn't affect the other channels |

**Assumptions:** 500M/day (400M push, 80M email, 20M SMS), campaign bursts ×10, 300M devices, ~500 B
per log record. **Out of scope:** template authoring, the segmentation engine, an in-app inbox.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| average send rate | 500M / 86,400 s | **5.8k /s** |
| campaign burst | × 10 | **~58k /s** |
| push at peak | 400M / 86,400 × 10 | **~46k /s** |
| SMS | 20M / 86,400 s | **~230 /s** (and real money per message) |
| delivery log, 30 days | 500M × 30 × 500 B | **~7.5 TB** |
| devices table | 300M × 250 B | **~75 GB**, small enough to cache |

What the numbers say: 58k/s is easy for queues and workers. The binding constraints are each
provider's throughput limit, their latency and outages, and SMS cost.

## 3. API and data model
- `POST /notifications {user_id | segment_id, template, params, category, priority, channels?,
  idempotency_key, send_at?}` → `202 {notification_id}` after persisting. Delivery happens later.
- `GET /notifications/{id}` → status per channel, attempts, timestamps.
- `PUT /users/{id}/preferences {category, channel, enabled}`, and
  `POST /users/{id}/devices {platform, push_token}` from the apps.

| entity | key and fields | store |
|---|---|---|
| `devices`, `contacts` | user_id, device_id, platform, push_token; email, phone | SQL, cached |
| `preferences` | user_id, category, channel, enabled | SQL, cached |
| `notification_log` | notification_id, idempotency_key (unique), user, channel, priority, status, attempts, provider_msg_id; TTL 30 d | wide-column (Cassandra) |
| counters | per-user daily marketing count; per-provider token buckets | Redis |

## 4. Decompose: the parts
Three sub-problems: the entrance, sharing capacity, and the provider side.

### Part P1: Accept fast and enforce policy at one gate (F2, F3, N1)
Validate, apply opt-outs and caps, make the request durable and answer in milliseconds, so that a
retried request can never send twice.

| option | pros | cons |
|---|---|---|
| send inside the request | caller sees the outcome | callers wait seconds; a blip loses the message |
| enqueue, check prefs in each worker | fast accept | policy spread across workers; one gap spams an opted-out user |
| **one gate: check → log (unique key) → enqueue → 202** | policy in exactly one place; the log answers status and dedups | one extra write; cache invalidation on opt-out |

**Choice:** a load-balanced Notification API. It reads preferences and devices through a cache
(75 GB fits), checks the per-user cap, writes the log row under the idempotency key, enqueues the
work and returns 202. A retry with the same key finds the row and gets the same `notification_id`.

```diagram
part:P1
```

### Part P2: Traffic isolation and campaign pacing (F2, N2, N3)
A login code must not queue behind 50M marketing messages, and a slow SMS vendor must not delay push.

| option | pros | cons |
|---|---|---|
| one shared queue | simplest | codes wait behind campaigns; one slow vendor blocks everything |
| queues per channel | fixes N3 | codes still wait behind marketing in their channel |
| one priority queue | one thing to run | starvation and poor broker support under huge backlogs |
| **queues per channel × priority + paced scheduler** | N2 and N3 both hold; bursts are shaped | more queues and pools to size |

**Choice:** transactional and bulk queues per channel, each drained by its own worker pool.
Campaigns and scheduled sends go to a scheduler that pages through the segment and releases batches
at a set rate. Transactional traffic is a few percent of volume, so its queues stay near empty.

```diagram
part:P2
```

### Part P3: Provider delivery under limits and failures (F1, F4, N1, N3)
Send at the rate each provider allows, survive throttling and outages, never double-send an SMS, and
record every outcome.

| option | pros | cons |
|---|---|---|
| send as fast as possible, retry at once | simple | 429 storms, a sick provider is hammered, duplicates after timeouts |
| a single CPaaS aggregator | less code | its outage is yours; pricier; you still need idempotency |
| **token buckets + backoff delay queue → DLQ + idempotency in the log** | smooth under limits; outages wait instead of failing | a shared counter store; more moving parts |

**Choice:** a worker takes a token from the provider's bucket and sends with the idempotency key. If
the send fails, the message goes to a delay queue with exponential backoff and jitter, and after N
tries to the dead-letter queue. Each outcome lands in the log. A circuit breaker stops calling a
provider that keeps failing, and SMS/email can fail over to a second vendor.

```diagram
part:P3
```

## 5. Reduce: the high-level design
**v1, naive:** one service sends inline while the caller waits. Slow providers block callers, blips
lose messages, and campaigns starve login codes.
```diagram
v1
```
**v2, compose P1:** an API behind a load balancer checks policy once, logs, enqueues and returns 202.
Callers are decoupled, but one shared queue still mixes everything.
```diagram
v2
```
**v3, compose P2:** queues by channel and priority with their own workers, and a paced campaign
scheduler.
```diagram
v3
```
**v4, compose P3:** token buckets, a backoff delay queue with a DLQ, and idempotency checks against the
log.
```diagram
v4
```

## 6. Deep dives
- **Ambiguous timeouts.** If the SMS vendor times out, you don't know whether the message went out.
  The worker writes `sending` before the call and `sent` after it. A redelivered message that finds
  `sent` is skipped, and providers that accept an idempotency key dedup the rest. Login codes carry
  a TTL and are dropped once expired, because a code that arrives late is worse than one that never
  arrives.
- **Where limits live.** The per-user cap is a product rule, so it is checked once at the gate (P1).
  Provider send rates are an operational limit, so they are enforced where sending happens (P3).
  Token buckets spread a burst out instead of rejecting it.
- **Expanding a segment.** Never turn 50M users into 50M enqueues in one second. The scheduler pages
  through the segment at a target rate, which also lets you pause or cancel a bad campaign halfway.
- **Preference changes.** On opt-out, write SQL and then delete the cache key. A bounded TTL covers
  the rare race, and a final check in the bulk worker catches campaigns queued before the change.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Kafka](#/topic/system-design/kafka) | queues per channel × priority, retry topics | SQS + delay queues, RabbitMQ |
| [Redis](#/topic/system-design/redis) | prefs cache, per-user caps, provider token buckets | Memcached (cache only) |
| [PostgreSQL](#/topic/system-design/postgresql) | preferences, devices, contacts | MySQL |
| [Cassandra](#/topic/system-design/cassandra) | `notification_log` with a 30-day TTL | DynamoDB with TTL |

## 8. Patterns
- [Retries and DLQs](#/topic/system-design/retries-dlq): backoff with jitter, then park poison
  messages.
- [Idempotency](#/topic/system-design/idempotency): one key per request at the gate, one per
  (notification, channel) at the provider.
- [Backpressure](#/topic/system-design/backpressure): token buckets and a paced scheduler shape load
  to what providers accept.
- The transferable shape is **accept fast, deliver asynchronously**. Validate and persist, enforce
  policy at one gate, route into per-class queues, and let workers own retries, idempotency and
  third-party limits. Webhook delivery, payouts and email marketing work the same way.

## 9. Evaluation
- **Bottlenecks:** segment expansion (paced scheduler), the preference lookup per send (cache),
  provider throughput (buckets, extra vendors).
- **Failures:** if a provider is down, messages wait in queues while retries back off and the circuit
  breaker opens; SMS and email fail over to a second vendor. If a worker crashes mid-send, the message
  is redelivered and the log check stops a duplicate. Poison messages go to the DLQ.
- **Monitoring:** queue depth and oldest-message age per channel × priority, accept → sent p99 for
  transactional traffic, provider error and throttle rates, DLQ size, suppression rate and daily SMS
  spend.
- **The 30-second answer:** a load-balanced API checks cached preferences and caps, logs under an
  idempotency key, enqueues and returns 202. Queues are split by channel and priority with their own
  workers, and campaigns flow through a paced scheduler. Workers send within per-provider token
  buckets, retry with backoff through a delay queue into a DLQ, and record every outcome in a 30-day
  log.

## 10. Tips and common mistakes
- Don't make the caller wait for Apple. Answer 202 once the request is persisted.
- "Use a queue" is not enough: one queue for everything is exactly how login codes get stuck.
- Enforce opt-outs in one place, and say where.
- Retries without idempotency send duplicate SMS, and those cost money and trust.
- Size by provider limits and cost, not by your own QPS.

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [rate limiting](#/learn/system-design/rate-limiting)
- [Caching](#/learn/system-design/caching) for the preference lookup
- [Microservices](#/topic/system-design/microservices) and [observability](#/topic/system-design/observability)
