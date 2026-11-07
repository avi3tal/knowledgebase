# Solution: ad click aggregator

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Three parties need different things from the same events, at different speeds:
- the **user** wants a fast redirect;
- the **advertiser** wants charts that are fresh within a minute;
- **billing** wants numbers that are exactly right, eventually.

The design separates these needs. It **logs first**, aggregates in a stream for freshness, serves
pre-aggregated rollups for queries, and **reconciles** against a replayable raw archive for
correctness. Dedup and idempotency run through all of it.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Record each click and redirect to the landing page |
| F2 | Aggregate clicks per ad per minute (and hour, day) |
| F3 | Advertisers query by ad or campaign over ranges up to 90 days |
| F4 | Duplicate clicks count once |
| N1 | Redirect < 50 ms p99, independent of aggregation |
| N2 | No click lost; billing counts exact after daily reconciliation |
| N3 | Dashboards fresh within ~1 minute |
| N4 | Queries < 1 s |

**Assumptions:** 1B clicks/day, peaks of 5×, 10M active ads, about 200 B per event, raw data kept 90
days. **Out of scope:** ad serving and auctions, fraud models beyond dedup, and invoicing.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| clicks | 1B ÷ 86,400 | **12k /s** (peak ~60k) |
| raw events per day | 1B × 200 B | **200 GB/day** |
| raw archive, 90 days | 200 GB × 90 | **18 TB** |
| minute rollup rows | 10M ads × 1,440 × ~3% active | **~430M rows/day** (~22 GB) |
| dedup state | 60k/s × 3,600 s × 50 B | **~11 GB** at peak, spread over the job |

60k writes/s is too many for a transactional database on the redirect path, but easy for an
append-only log. Rollups are about 100× smaller than raw events, which is what makes sub-second
90-day charts possible.

## 3. API and data model
- `GET /click/{impression_id}` → `302 Location: landing_url`. The ad server signs the impression id
  (ad_id, campaign_id, issued_at, nonce), so the id can be trusted and used as the dedup key.
- `GET /ads/{ad_id}/metrics?start&end&granularity=minute|hour|day` → `{series[{ts, clicks}]}`, and the
  same for campaigns.
- `click_events(impression_id, ad_id, campaign_id, event_time, …)` go to Kafka (by ad_id) and are
  archived as Parquet in object storage.
- `ad_clicks_minute(ad_id, campaign_id, minute, clicks)` plus hourly and daily rollups live in a
  columnar OLAP store, partitioned by day.

## 4. Decompose: the parts
Five sub-problems, one per hard requirement.

### Part P1: Click ingestion and redirect (F1, N1, N2)
| option | pros | cons |
|---|---|---|
| insert into a DB, then redirect | simple | 60k inserts/s on the user's path |
| browser beacon after redirect | free | ad blockers and closed tabs lose clicks |
| **append to a durable log, then 302** | ~5 ms; buffers downstream outages | one more system |

**Choice:** a stateless click service behind the LB verifies the signature, appends the event to Kafka
(acks=all, partitioned by ad_id) and answers 302. Aggregation can be down for an hour and redirects
won't notice.

```diagram
part:P1
```

### Part P2: Stream aggregation per ad per minute (F2, N3)
| option | pros | cons |
|---|---|---|
| counter row per click | always current | a write per click; hot rows for viral ads |
| hourly batch | exact, simple | dashboards up to an hour stale |
| **stream: 1-minute event-time windows keyed by ad_id** | one write per ad per minute; handles lateness | a stateful job to operate |

**Choice:** Flink with tumbling 1-minute windows on **event time**, so a click counts in the minute it
happened. The watermark runs 30 s behind the newest event.

```diagram
part:P2
```

### Part P3: Dedup and exactly-once counting (F4, N2)
| option | pros | cons |
|---|---|---|
| count everything | trivial | advertisers pay for double clicks and retries |
| unique index on click_id in a DB | exact | a DB write per click again |
| **signed impression id + keyed state with TTL + idempotent upserts** | in-memory, stream speed; replays are harmless | state grows with the TTL |

**Choice:** Flink remembers each impression_id it has seen for 1 hour, in checkpointed keyed state.
Window results are **upserted** by `(ad_id, minute)`: they overwrite, never increment. After a crash
the job restores its checkpoint, replays Kafka from the matching offsets, and writes the same values
again.

```diagram
part:P3
```

### Part P4: Storage for advertiser queries (F3, N4)
| option | pros | cons |
|---|---|---|
| query raw clicks | flexible | billions of rows per chart |
| KV keyed (ad_id, minute) | fast for one ad | group-by across a campaign is many reads |
| **columnar OLAP store with minute, hour and day rollups** | fast scans and group-bys | prefers batched writes |

**Choice:** an OLAP store in the ClickHouse, Pinot or Druid class. It keeps minute rows for 7 days and
hour and day rows for 90 days. The query service picks the coarsest table that answers the request, so
a 90-day campaign chart reads thousands of rows.

```diagram
part:P4
```

### Part P5: Reconciliation with batch (N2, F2)
| option | pros | cons |
|---|---|---|
| trust the stream | one pipeline | a bug silently misbills |
| replay Kafka through a fixed job | one code path | retention must cover the window; competes with live traffic |
| **raw archive + nightly batch recompute** | an independent check and exact bills | two code paths to keep in agreement |

**Choice:** a Kafka sink writes raw clicks to object storage every hour. Each night a Spark job
recomputes the daily counts with the same dedup rules, overwrites the day in the OLAP store, and
alerts if stream and batch differ by more than 0.1%.

```diagram
part:P5
```

## 5. Reduce: the high-level design
**v1, naive:** insert a row per click and run `COUNT(*) GROUP BY minute` for dashboards. This puts
writes on the redirect path, counts every duplicate, and makes 90-day scans hopeless.
```diagram
v1
```
**v2, compose P1, P2 and P4:** the click service logs to Kafka and redirects, Flink counts per minute,
the OLAP store holds rollups, and the query service reads them.
```diagram
v2
```
**v3, compose P3 and P5:** dedup state and checkpoints make the counts exactly-once, and a raw archive
plus a nightly batch provide the billing truth.
```diagram
v3
```

## 6. Deep dives
- **Late events.** Windows are on event time with a 30 s watermark and **10 minutes of allowed
  lateness**. A late click re-fires its window, and the upsert simply replaces the count. Anything
  later goes to a side output, and the nightly batch includes it, so nothing is silently lost.
- **A viral ad.** One ad at 20k clicks/s lands on one partition and one task. When an ad_id is detected
  as hot, salt it into N sub-keys, count each sub-key, and merge per minute. Counts are additive, so
  the merge is exact.
- **Kafka unreachable from the click service.** Buffer events on local disk for a short time and still
  redirect. The redirect never waits for analytics.
- **Exactly-once, honestly.** True exactly-once delivery doesn't exist end to end. What we build is
  at-least-once delivery, made effectively-once by dedup on impression_id and idempotent (overwrite)
  writes.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Kafka](#/topic/system-design/kafka) | durable, replayable click log keyed by ad_id | Kinesis, Pulsar |
| [Flink](#/topic/system-design/flink) | event-time windows, dedup state, checkpoints | Spark Structured Streaming, Kafka Streams |
| [Object storage](#/topic/system-design/object-storage) | 90-day raw archive (Parquet) for audits and reconciliation | HDFS |
| [Time-series / OLAP store](#/topic/system-design/time-series-db) | minute, hour and day rollups for dashboards | ClickHouse, Apache Pinot, Druid; Cassandra for single-ad lookups |

## 8. Patterns
- [Idempotency](#/topic/system-design/idempotency): impression_id dedup and upserts by (ad_id, minute)
  make retries and replays harmless.
- [Pre-aggregation](#/topic/system-design/pre-aggregation): minute rollups, then hour and day rollups.
- [Hot keys](#/topic/system-design/hot-keys): salting a viral ad_id.
- [Backpressure](#/topic/system-design/backpressure): Kafka absorbs peaks and outages between
  ingestion and counting.
- The transferable shape is **log first, aggregate in the stream, serve rollups, reconcile with
  batch.** Metrics pipelines, usage-based billing, and view counters on video or social posts all have
  the same shape.

## 9. Evaluation
- **Bottlenecks:** hot ads on one partition (salting), dedup state size (TTL), and OLAP ingest (batched
  upserts per minute, not per click).
- **Failures:** a Flink crash restarts from its checkpoint and replays from Kafka, and upserts prevent
  double counts. If the OLAP store is down, dashboards go stale but nothing is lost. If Kafka is
  unreachable, the click service buffers locally and still redirects.
- **Monitoring:** consumer lag, watermark delay, late-event and dedup-drop rates, the daily difference
  between stream and batch, redirect p99, and query p99.
- **The 30-second answer:** the click endpoint verifies a signed impression id, appends to Kafka by
  ad_id, and redirects. Flink counts per ad per minute on event time with watermarks, drops repeated
  impression ids using checkpointed state, and upserts minute rollups into a columnar OLAP store, which
  dashboards query through hour and day rollups. Raw clicks are archived to object storage, and a
  nightly batch recomputes exact daily counts for billing and alerts on drift.

## 10. Tips and common mistakes
- Never put the database write between the click and the redirect.
- Say *which* minute a late click counts in. "Event time with a watermark" is the answer interviewers
  listen for.
- "Exactly-once" needs a mechanism: a dedup key plus idempotent writes. Kafka or Flink settings alone
  are not enough.
- Don't let dashboards query raw events. Pre-aggregate, then roll up again.
- Billing needs a source of truth you can replay. Mention reconciliation before you're asked.

## 11. Learn more
- [Stream processing](#/topic/system-design/stream-processing) and
  [message queues](#/learn/system-design/message-queues)
- [Databases: SQL vs NoSQL](#/topic/system-design/databases-sql-nosql) and
  [sharding](#/learn/system-design/sharding)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
- [Ad click aggregator](#/topic/system-design/ad-click-aggregator)
