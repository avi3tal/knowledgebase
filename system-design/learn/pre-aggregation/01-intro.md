# Pre-aggregation and rollups

> Pattern · Ideas: aggregate on ingest, tumbling windows, rollup tiers (1m → 1h → 1d), sum + count

Dashboards ask the same shape of question over and over: "clicks per minute for ad X over the
last hour", "p50 latency per hour this week". Answering from raw events means scanning millions
of rows on every refresh. **Pre-aggregation** does the counting **once, as events arrive**, and
stores small summary rows that the query reads instead.

```
raw events (10k/s)                     minute buckets                  dashboard
─────────────────────                  ──────────────────              ─────────────
 12:00:05 ad1 click ┐                   ad1 @12:00 → 2      ┐
 12:00:30 ad1 click ┘──► stream job ──► ad1 @12:01 → 3      ├──►  reads 60 rows
 12:01:01 ad1 click ┐    (count per     ad1 @12:02 → 2      ┘     for "last hour"
 12:01:10 ad1 click ┘     ad, minute)   ad2 @12:00 → 1
```

## The numbers
An ad platform with 10k clicks/s produces ~864M raw events a day. One ad's "last hour" query
over raw data scans every click of that hour, roughly 36M rows if you can't index by ad. With
per-minute buckets it reads **60 rows**, a few kilobytes, in a millisecond or two. Storage shrinks too:
10M ads × 1,440 minutes is the upper bound, but only active ads produce buckets, so a day's
rollups are often ~100× smaller than the raw stream.

## Tumbling windows
A **tumbling window** is a fixed, non-overlapping interval: every event belongs to exactly one
window, found by `bucket = timestamp // window_size`. The aggregation key is
`(dimensions…, bucket)`, here `(ad_id, minute)`, and the value is a counter (or sum, min, max).
```python
def on_event(ad_id, ts):
    key = (ad_id, ts // 60)
    buckets[key] += 1          # upsert: insert at 0 if missing, then add
```
In production this runs in a [stream processor](#/topic/system-design/stream-processing)
(e.g. Flink or Kafka Streams) with keyed state, and the finished buckets are upserted into the
serving store. For modest volumes, a batch job every few minutes over the raw log works too.

## What you give up
- **Resolution:** once events are folded into minutes, you can't ask about a 10-second spike
  unless you kept a finer tier or the `max`.
- **Flexibility:** you can only slice by the dimensions you aggregated on. A new "by country"
  breakdown needs a new rollup and a backfill from raw data.
- **Freshness:** the current bucket is still open, so the newest point is partial.

Step through the trace: ten clicks fold into six bucket rows, and the dashboard query for `ad1`
reads only three.
