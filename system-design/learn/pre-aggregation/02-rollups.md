## Rollup tiers
One tier is rarely enough. A query for "the last 2 years" over minute buckets would read about 1M
rows per series. So you roll up again, each tier built from the one below it:

```
raw events ──► 1-minute buckets ──► 1-hour buckets ──► 1-day buckets
 keep 7 d        keep 30 d             keep 1 y            keep forever
 (replay)        43,200 rows/series    8,760 rows/series   365 rows/series/yr
```
The query layer picks the tier from the requested range so that every panel reads at most
~1,000 points per series: minutes for the last day, hours for the last month, days beyond
that. Old fine-grained data is deleted. That retention ladder is where most of the storage
saving comes from.

## Store what composes: sum and count, not avg
A rollup must be **mergeable**: you must be able to build the hour from its minutes without going
back to the raw events.
- `count`, `sum`, `min` and `max` merge exactly: add the sums, add the counts, take the min of the mins.
- `avg` does **not** merge. The average of averages weighs a 1-request minute the same as a
  200-request minute. Store `sum` and `count` and divide at query time.
- Percentiles and distinct counts don't merge either. Use mergeable sketches (t-digest or
  HDRHistogram for latency, HyperLogLog for unique users, about 12 KB each) instead of storing a
  p99 per bucket.

The trace rolls three minutes of hour 0 into one hour row. A quiet minute with one slow request
(40 ms) pulls the average of averages up to 19 ms, but the true average over 301 requests is 9 ms.

## Late and duplicate events
Events arrive out of order: phones reconnect, brokers retry. A bucket is only **final** once a
watermark passes its end (say, 2 minutes after the window closes). Later events either update
the bucket (an upsert, so the dashboard number changes slightly) or go to a correction path.
Duplicate deliveries double-count unless you dedupe by event id before counting (see
[idempotency](#/topic/system-design/idempotency)). Keep the raw log so a batch job can
**reconcile** and rebuild buckets when the stream was wrong.

## Where the buckets live
Minute rows are small and keyed by `(entity, bucket)`, so a key-value or wide-column table, a
[time-series DB](#/topic/system-design/time-series-db) or an
[OLAP store](#/topic/system-design/olap-stores) all work. Choose by the query: point lookups
per entity suit a key-value store, while group-bys across many entities suit columnar storage.
