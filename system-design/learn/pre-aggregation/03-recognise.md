## How to recognise you need it

**Strong signals:**
- A **high-volume event stream** (clicks, views, likes, metrics) whose consumers only want
  **counts, sums or rates**, not the individual events.
- Dashboards that refresh every few seconds over fixed windows: "per minute", "last 24 h",
  "daily totals".
- A read latency target (under 1 s) that a raw scan of millions of rows can't meet.
- Long retention at coarse resolution ("2 years of hourly data") next to short retention of raw data.
- A counter on a hot item (a viral post's likes) written thousands of times per second. Batch
  the increments into `+n` updates instead of one write per event.

**Anti-signals:**
- Queries are **ad-hoc**: any filter, any group-by, decided by an analyst tomorrow. You can't
  predict the dimensions, so use an [OLAP store](#/topic/system-design/olap-stores) that scans raw
  columns fast.
- You need the **individual events** back (audit, "show me each click"). Rollups throw that away.
- Low volume: 100 events/s fits in one indexed table and `GROUP BY` is fine.

**Look-alikes, and why they're different:**
- **[Caching](#/learn/system-design/caching)** stores the **result of a query** after it is first
  asked, and expires it. Pre-aggregation computes summaries **on ingest** before anyone asks, and
  they are the source of truth for the dashboard.
- **[Stream processing](#/topic/system-design/stream-processing)** is the engine (windows, state,
  watermarks). Pre-aggregation is one thing you do with it, and you can also do it in batch.
- **[OLAP stores](#/topic/system-design/olap-stores)** make raw scans fast and flexible. Many of
  them support rollups or materialised views as well, so the two are often combined.
- **[Time-series DBs](#/topic/system-design/time-series-db)** store metric samples and
  downsample them. Downsampling is pre-aggregation built into the store.

**Interview pitfalls:**
- Storing `avg` or `p99` per bucket and then averaging them across buckets.
- No answer for late or duplicate events, or for what happens when a bucket is already "final".
- Forgetting to keep the raw log, so you can't backfill a new dimension or fix a bug.
- Too many dimensions in the key (ad × country × device × hour). The number of buckets explodes
  and approaches the raw event count.

**In our problems:**
- **url-shortener:** click analytics become daily counts per link instead of a scan of raw clicks.
- **instagram:** like events are batched into counter increments for hot posts.
- **typeahead:** the answer for each prefix is computed ahead of time, not at query time.
- **youtube:** view events are counted in batches instead of one write per view.
- **ad-click-aggregator:** minute rollups, then hour and day tiers, are the core of the design.
- **metrics-monitoring:** downsampled tiers make long-range dashboard queries cheap.
