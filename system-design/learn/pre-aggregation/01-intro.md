# Pre-aggregation and rollups

> Pattern · Ideas: aggregate on ingest, tumbling windows, rollup tiers (1m → 1h → 1d), sum + count

Dashboards ask the same shape of question over and over: "clicks per minute for ad X over the
last hour", "p50 latency per hour this week". Answering from raw events means scanning millions
of rows on every refresh. **Pre-aggregation** does the counting **once, as events arrive**, and
stores small summary rows that the query reads instead. The tabs play out a crash and replay,
the batch alternative, and a cardinality explosion.

```figure
ingest-pipeline
```

## The numbers

> [!NUMBERS] Raw scan vs minute buckets (10k clicks/s)
> - Raw volume: 10k/s × 86,400 s ≈ **864M events/day**.
> - "Last hour for one ad" over raw data, without an index by ad: 10k/s × 3,600 s = **36M rows**.
> - The same question over `(ad, minute)` buckets: **60 rows**, a few kilobytes, ~1–2 ms.
> - Storage: 10M ads × 1,440 minutes is the upper bound, but only active ads produce buckets, so
>   a day's rollups are often ~100× smaller than the raw stream.

```figure
raw-vs-rollup
```

## Tumbling windows
A **tumbling window** is a fixed, non-overlapping interval: every event belongs to exactly one
window, found by `bucket = timestamp // window_size`. The aggregation key is
`(dimensions…, bucket)`, here `(ad_id, minute)`, and the value is a counter (or sum, min, max).
```python
def on_event(ad_id, ts):
    key = (ad_id, ts // 60)
    buckets[key] += 1          # upsert: insert at 0 if missing, then add
```

## Where the counting runs

| option | freshness | cost per query | flexibility |
|---|---|---|---|
| query raw events (OLAP scan) | seconds | scans every matching event | any filter, any group-by |
| batch rollup every N minutes | N minutes | reads buckets | fixed dimensions |
| stream rollup on ingest | seconds | reads buckets | fixed dimensions |

> [!PROS] Stream rollup
> - Fresh numbers and constant-cost reads, whatever the traffic.
> - Writes shrink too: one `+n` upsert per bucket per flush instead of one write per event.

> [!CONS] Stream rollup
> - A [stream processor](#/topic/system-design/stream-processing) (Flink, Kafka Streams) with
>   keyed state, checkpoints and watermarks to run and operate.
> - Only answers the questions you planned for.

For modest volumes, a batch job every few minutes over the raw log is simpler and good enough.

## What you give up
- **Resolution:** once events are folded into minutes, you can't ask about a 10-second spike
  unless you kept a finer tier or the `max`.
- **Flexibility:** you can only slice by the dimensions you aggregated on. A new "by country"
  breakdown needs a new rollup and a backfill from raw data.
- **Freshness:** the current bucket is still open, so the newest point is partial.

> [!PITFALL] Dimension explosion
> Every dimension multiplies the key space: 10M ads × 200 countries × 3 devices = 6B possible
> buckets per minute against 600k clicks per minute, so most buckets hold one click and the
> rollup is as big as the raw stream. Aggregate on what the dashboards actually filter by.

Step through the trace: ten clicks fold into six bucket rows, and the dashboard query for `ad1`
reads only three.
