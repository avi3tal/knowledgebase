## Architecture at a glance

Before windows and tiers, see the system an architect would draw. This is an ad-click analytics
platform: ad servers emit clicks, advertisers watch live dashboards, and billing needs numbers that
are final. Watch the two paths, a fast streaming one and a slow, exact batch one, meet in the same
rollup store. Then switch the tabs: a traffic spike, a processor crash and a fraud-rule change.

```figure
system-overview
```

### Zoom in: closing a window

A window can only write its row once the processor believes no more events for it are coming.
That moment is the trade-off between freshness and correctness. Watch the watermark, then try the
tabs: a late click that still counts, a straggler that arrives after the window closed, and a lost
write acknowledgement.

```figure
window-close
```

### Zoom in: the query router

Storing several tiers only pays off if every query reads the coarsest one that answers it. Watch
how the range picks the tier and how the still-open part of the range is filled in. The tabs show a
live one-hour panel, a range past retention and a lagging hour rollup.

```figure
query-router
```

### How it scales

The design changes as click volume grows. It starts with queries over raw rows, moves to batch
rollups, then to streaming rollups, and finally to streaming plus reconciliation from raw (lambda)
or replay (kappa).

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| When to aggregate | at query time · batch · streaming | **Streaming, corrected by batch** | Seconds-fresh dashboards, and numbers that billing can trust |
| Window and tiers | one tier · minute → hour → day | **Minute → hour → day**, longer retention per tier | Each query reads few rows, and storage stays bounded for years of history |
| Late events | drop · wait forever · allowed lateness + recon | **Short allowed lateness (seconds), recon for the rest** | Bounded state in the stream job; stragglers still end up in the final numbers |
| Row writes | increment (add) · upsert absolute value | **Upsert the full value** per (ad, minute) | Retries and replays don't double count |
| Source of truth | rollups · raw archive | **Raw archive** | Any bug or rule change can be fixed by recomputing from raw |
| Ad-hoc questions | more rollup dimensions · warehouse over raw | **Warehouse over raw** | Rollups answer known questions; unknown ones need the raw data |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Cardinality explosion | a new high-cardinality dimension (user, URL) | Rollups grow as big as raw, and writes slow down | Review dimensions, cap top-N, send the rest to the warehouse |
| Double counting | replay after a crash, retried writes | Inflated clicks and spend | Checkpointed state, absolute upserts, dedup by event id in recon |
| Late data undercount | mobile clients offline, a lagging partition | Streaming rows too low | Watermarks with allowed lateness, late-event metric, nightly recon |
| Stream and batch disagree | two code paths drift apart | Numbers change when a day goes final | Shared logic or kappa replay, "provisional / final" labels, diff alerts |
| Processor lag | traffic spike, hot ad on one partition | Dashboards fall behind | Scale to the partition count, split hot keys, show "data as of" |
