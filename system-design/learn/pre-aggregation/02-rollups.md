## Rollup tiers
One tier is rarely enough. A query for "the last 2 years" over minute buckets would read about 1M
rows per series. So you roll up again, each tier built from the one below it:

```figure
rollup-tiers
```

| tier | kept for | rows per series | serves |
|---|---|---|---|
| raw events | 7 days | every event | replay, backfill, audit |
| 1 minute | 30 days | 30 × 1,440 = 43,200 | the last day |
| 1 hour | 1 year | 365 × 24 = 8,760 | the last month |
| 1 day | forever | 365 per year | long ranges |

The query layer picks the tier from the requested range so that every panel reads at most
~1,000 points per series. Old fine-grained data is deleted. That retention ladder is where most
of the storage saving comes from.

## Late and duplicate events
Events arrive out of order: phones reconnect, brokers retry. A bucket is only **final** once a
watermark passes its end (say, 2 minutes after the window closes). Later events either update
the bucket (an upsert, so the dashboard number changes slightly) or go to a correction path.

```figure
late-events
```

Duplicate deliveries double-count unless you dedupe by event id before counting (see
[idempotency](#/topic/system-design/idempotency)). Keep the raw log so a batch job can
**reconcile** and rebuild buckets when the stream was wrong.

> [!INTERVIEW] What to say about correctness
> "The stream gives fast, approximately right numbers; a daily batch job over the raw log
> recomputes the buckets and overwrites them, and that's what billing uses."

## Where the buckets live
Minute rows are small and keyed by `(entity, bucket)`, so a key-value or wide-column table, a
[time-series DB](#/topic/system-design/time-series-db) or an
[OLAP store](#/topic/system-design/olap-stores) all work. Choose by the query: point lookups
per entity suit a key-value store, while group-bys across many entities suit columnar storage.

## Store what composes: sum and count, not avg
A rollup must be **mergeable**: you must be able to build the hour from its minutes without going
back to the raw events.

| aggregate | merges exactly? | store instead |
|---|---|---|
| count, sum, min, max | yes | as is |
| average | no | `sum` and `count`; divide at query time |
| p50 / p99 | no | a mergeable sketch (t-digest, HDRHistogram) |
| distinct users | no | HyperLogLog, about 12 KB, ~1% error |

> [!PITFALL] Average of averages
> It weighs a 1-request minute the same as a 200-request minute. Store `sum` and `count`.

The trace rolls three minutes of hour 0 into one hour row. A quiet minute with one slow request
(40 ms) pulls the average of averages up to 19 ms, but the true average over 301 requests is 9 ms.
