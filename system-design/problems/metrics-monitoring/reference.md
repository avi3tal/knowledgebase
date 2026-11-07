# Solution: metrics monitoring and alerting

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
It is the most **write-heavy** classic design: about 5M datapoints per second go in, and only a tiny
fraction is ever read. The data is append-only, ordered by time and highly compressible, so the design
is about three things:
- buffering ingest;
- compressing and downsampling storage;
- bounding every query.

Alerting adds a twist: it has to work *while everything else is failing*.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Collect metrics (name, tags, timestamp, value) from an agent on every host |
| F2 | Query and graph: time range, aggregation (avg, sum, p99), group by tag |
| F3 | Alert rules notify on-call (PagerDuty, Slack, email) without duplicates |
| F4 | Retention: raw 10 s data for 15 days, 1 min rollups for 30 days, 1 h rollups for 2 years |
| N1 | Ingest ~5M datapoints/s without loss during spikes |
| N2 | Dashboard queries p95 < 1 s for the last hour, a few seconds for long ranges |
| N3 | Alerts fire within ~1 min and keep working when monitored systems fail |
| N4 | Cheap per point: compress and downsample |

**Assumptions:** 100k hosts × 500 series, 10 s interval, so 50M active series; 5k open dashboards;
50k alert rules. **Out of scope:** logs, traces and anomaly detection.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| active series | 100k × 500 | **50M** |
| datapoints | 50M / 10 s | **5M /s** |
| raw bandwidth | 5M × 16 B | **80 MB/s** (before protocol overhead) |
| raw 15 days, uncompressed | 5M × 86,400 × 15 × 16 B | **~100 TB** |
| raw 15 days, compressed (~1.5 B/point) | same × 1.5 B | **~10 TB** |
| 1 min rollups, 30 days (~8 B/bucket compressed) | 50M × 43,200 × 8 B | **~17 TB** |
| 1 h rollups, 2 years | 50M × 17,520 × 8 B | **~7 TB** |
| dashboard queries | 5k × 20 / 30 s | **~3,300 /s** |
| alert evaluations | 50k / 30 s | **~1,700 /s** |

What the numbers say:
- Compression gives you 10× and it is not optional.
- Reads are ~1,000× rarer than writes, but each read can touch thousands of series.
- Cost follows the number of **active series** (memory, index), not datapoints.

## 3. API and data model
- `POST /v1/series [{metric, tags, points: [[ts, value]]}]` → `202`. Agents batch every 10 s and
  gzip the body. Collectors answer only after Kafka has acknowledged.
- `GET /v1/query?q=avg:cpu{service=web} by {host}&from&to&step` → `[{tags, points}]`.
- `POST /v1/alerts {name, query, condition, for, channels}` → `201`; `GET /v1/alerts/{id}` → state.

| entity | fields | store |
|---|---|---|
| `series_index` | series_id ↔ metric + sorted tags; inverted tag → series ids | in-memory inverted index per shard |
| `datapoints` | series_id, ts, value, in 2 h compressed blocks | TSDB, sharded by series hash |
| `rollups` | series_id, bucket, min, max, sum, count | object storage (columnar blocks) |
| `alert_rules`, `alert_state` | rule, condition, for, channels; state, since, fingerprint | Postgres |

Rollups store `sum` and `count` rather than `avg`, so averages stay correct when 1 min buckets are
re-aggregated into hours.

## 4. Decompose: the parts
Four sub-problems: getting data in, keeping it cheaply, reading it back, and acting on it.

### Part P1: Ingestion pipeline (F1, N1)
| option | pros | cons |
|---|---|---|
| agents write straight to storage | fewest hops | storage slowness pushes back on every host; no replay |
| pull: scrapers poll `/metrics` (Prometheus) | server controls rate; a failed scrape is a signal | service discovery and sharded scrapers; awkward across networks and for short jobs |
| **push to collectors → partitioned log** | absorbs spikes, replayable, many consumers | one more system; seconds of lag |

**Choice:** agents push batches to stateless collectors behind a load balancer. Collectors validate,
enforce limits and produce to Kafka, keyed by series hash. Writers consume one partition each, so a
series always lands on the same writer and appends stay in order. If the TSDB is slow, Kafka holds
hours of data and nothing is lost.

```diagram
part:P1
```

### Part P2: Time-series storage and downsampling (F4, N4)
| option | pros | cons |
|---|---|---|
| SQL table (series_id, ts, value) | familiar | an index entry per point at 5M rows/s; no compression |
| wide-column (Cassandra), key = series + time bucket | linear write scaling | you build compression and rollups yourself |
| **purpose-built TSDB + rollups + object storage** | ~1.5 B/point, append-only, fast range scans | specialised; sensitive to cardinality |

**Choice:** the TSDB keeps a mutable **head block** in memory for the last ~2 hours and then seals it
into an immutable compressed block. Timestamps use delta-of-delta encoding; regular 10 s intervals
cost almost nothing. Values are XOR-ed with the previous value, and slowly changing gauges compress
very well. A downsampler turns sealed blocks into 1 min rollups (kept 30 days) and 1 h rollups (kept 2
years) in object storage. Keeping 1-minute data for 2 years would cost as much as the raw tier, which
defeats the purpose.

```diagram
part:P2
```

### Part P3: Query path for dashboards (F2, N2)
| option | pros | cons |
|---|---|---|
| always read raw | exact | a 90-day panel over 1,000 series reads ~800M points |
| **resolution by range + scatter-gather + result cache** | every query bounded; refreshes are cheap | rollups hide sub-minute spikes (keep max in the rollup) |

**Choice:** the query service resolves tag filters to series ids in the series index. It picks raw
data for ranges under a day and rollups beyond that, so a panel reads at most ~1,000 points per series
(the panel's width in pixels). It then fans out to the TSDB shards and merges partial aggregates. The
result cache is keyed by `(query, step, window aligned to step)`. Most dashboard load is the same
panels refreshing, so only the newest bucket is recomputed.

```diagram
part:P3
```

### Part P4: Alert evaluation and notification (F3, N3)
| option | pros | cons |
|---|---|---|
| **periodic evaluation of each rule's query** | one query language for graphs and alerts; simple state | query load; latency = interval + ingest lag |
| streaming evaluation on the ingest log (Flink) | seconds of latency, no storage load | per-rule window state; joins and ratios are hard |

**Choice:** evaluators split the rules by `rule_id` (each one holds a lease on its shard) and run every
rule every 30 s against the hot tier. Each rule moves through **ok → pending → firing → resolved**,
and it only fires after the rule's `for` duration. State changes go onto a notification queue. A
notifier dedupes them by fingerprint, groups related alerts per service and routes them to the right
channel, retrying on failure. At ~1,700 cheap queries/s against recent, cached data, periodic
evaluation is affordable. Streaming stays an option for the few rules that need seconds.

```diagram
part:P4
```

## 5. Reduce: the high-level design
Merge the parts by node id.

**v1, naive:** one metrics service in front of a SQL table of datapoints. It breaks on N1 (5M inserts
per second), N4 (100 TB uncompressed) and N2 (long ranges scan millions of rows).
```diagram
v1
```
**v2, compose P1 and P2:** collectors, Kafka, writers, the compressed TSDB, the series index, and the
downsampler writing to object storage. Dashboards still read raw data directly.
```diagram
v2
```
**v3, compose P3:** the query service uses the series index, picks the resolution by range and caches
refreshing panels.
```diagram
v3
```
**v4, compose P4:** sharded alert evaluators, alert state, a notification queue and a notifier that
pages humans.
```diagram
v4
```

## 6. Deep dives
- **Cardinality.** A `user_id` or `request_id` tag turns one metric into millions of series. That
  means more head-block memory, a bigger index and slower queries. Collectors enforce per-tenant
  active-series limits, drop known unbounded tags and publish a cardinality report per metric.
- **Late and out-of-order points.** Accept points into the head block within a window (say 1 h) and
  reject or side-load older ones. Rollups for a bucket are only final after that window.
- **Hot shards.** Sharding by series hash spreads load evenly. A single huge query, like "all hosts,
  90 days", is protected by a query cost limit and by being forced onto rollups.
- **Flapping and storms.** The `for` duration and hysteresis (fire above 90%, resolve below 85%) stop
  flapping. Grouping by service turns 500 host alerts into one page. The fingerprint makes notifier
  retries idempotent.
- **Monitoring the monitor.** Alerting runs in its own cluster with its own small dependencies. A
  "dead man's switch" alert always fires, and an external service pages if it stops arriving.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Kafka](#/topic/system-design/kafka) | ingest buffer, partitioned by series hash; replay | Kinesis, Pulsar |
| [Time-series DB](#/topic/system-design/time-series-db) | compressed head and sealed blocks, sharded by series | Prometheus + Thanos/Mimir, M3, InfluxDB, VictoriaMetrics |
| [Object storage](#/topic/system-design/object-storage) | rollups and old blocks for 2-year retention | HDFS |
| [PostgreSQL](#/topic/system-design/postgresql) | alert rules and alert state | etcd for small rule sets |

## 8. Patterns
- [Backpressure](#/topic/system-design/backpressure): the log absorbs spikes, and collectors shed
  load per tenant before storage falls over.
- [Pre-aggregation](#/topic/system-design/pre-aggregation): 1 min and 1 h rollups with sum/count/min/max.
- [Scatter-gather](#/topic/system-design/scatter-gather): queries fan out to series shards and merge
  partial aggregates.
- [Idempotency](#/topic/system-design/idempotency): alert fingerprints make notification retries safe.
- The transferable shape is **append-only telemetry**. Buffer the firehose, compress by time, pre-aggregate
  for long ranges, and bound reads by resolution. Ad-click aggregation, IoT telemetry and billing meters
  have the same shape.

## 9. Evaluation
- **Bottlenecks:** head-block memory per active series, the series index under high cardinality, and
  query fan-out for wide queries.
- **Failures:** Kafka buffers hours if the TSDB is down, and writers replay from their offsets. A slow
  shard yields partial results flagged in the UI. Alerting is isolated and watched by a dead man's switch.
- **Monitoring:** Kafka consumer lag, dropped/rejected points, active series per tenant, query p95,
  evaluator loop time vs interval, notification failures.
- **The 30-second answer:** agents push batches to collectors that write to Kafka by series hash.
  Writers append to a sharded TSDB with Gorilla-style compression (~1.5 B per point), and a downsampler
  keeps 1 min (30 days) and 1 h (2 years) rollups in object storage. Queries resolve tags through an inverted index, pick
  the resolution by range, scatter-gather the shards and cache refreshing panels. Sharded evaluators run
  every rule every 30 s with a pending → firing state machine, and a notifier dedupes and groups pages.

## 10. Tips and common mistakes
- Don't store metrics in a relational table "with an index on time". Do the 5M/s and 100 TB math first.
- Pull vs push is a real trade-off, not a trick question. Say what each costs at 100k hosts.
- Forgetting downsampling means year-long graphs read billions of points.
- Store `sum` and `count` in rollups, never only `avg`: averages of averages are wrong.
- Mention cardinality. It is the failure mode that takes real monitoring systems down.
- Alerting that depends on the thing it monitors is not alerting.

## 11. Learn more
- [Observability](#/topic/system-design/observability) and [time-series databases](#/topic/system-design/time-series-db)
- [Message queues](#/learn/system-design/message-queues) and [stream processing](#/topic/system-design/stream-processing)
- [Sharding](#/learn/system-design/sharding) and [caching](#/learn/system-design/caching)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
