## Architecture at a glance

Before windows and tiers, see the system an architect would draw. This is the play-count and
royalty pipeline of a music-streaming service: players report every play, artists watch their
numbers on a dashboard, and once a month each artist gets a royalty statement that has to be
exact. Watch the two paths, a fast streaming one and a slow, exact one from the raw archive, both
write the same rollup store, and only the exact one feeds the statement. Then switch the tabs: an
album release night, a processor crash, and a backfill after a dedup bug.

```figure
system-overview
```

### Zoom in: windows, late plays and offline phones

A play belongs to the window of its start time, but phones upload late, retry, and sometimes stay
offline for hours. The window has to decide when to stop waiting, and someone still has to count
what arrives after that. Watch one play go from the phone to a minute row, then try the tabs: a
phone that syncs after a flight, an upload retried after a lost ack, and a track skipped before
30 seconds.

```figure
play-windows
```

### Zoom in: the query router

Several tiers only help if each query reads the coarsest one that answers it. Watch how the range
picks the tier and how the part that tier doesn't cover yet is filled from a finer one. The tabs
show a live last-hour panel, an hour rollup that fell behind, and a monthly statement that accepts
only final numbers.

```figure
tier-router
```

### How it scales

The design changes as listening grows. It starts with queries over raw plays, moves to batch
rollups, then to streaming rollups, and finally to streaming plus a nightly reconciliation from
the raw archive.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| When to aggregate | at query time · batch · streaming | **Streaming, corrected by a nightly recompute** | Live numbers for artists, exact numbers for payouts |
| What counts as a play | every start · a minimum listen time | **30 seconds, applied in both paths** | One rule, so the stream and the final numbers agree |
| Duplicates | trust the client · dedup by play id | **Play id from the device, dedup in stream and recon** | Retries and replays are normal on mobile networks |
| Late and offline plays | drop · wait for hours · short lateness + recon | **Minutes of allowed lateness, recon for the rest** | Bounded stream state, and every play is still paid |
| Tiers | one tier · minute → hour → day, per track / artist / country | **Minute → hour → day**, longer retention per tier | Each query reads few rows; years of history stay small |
| Source of truth for money | rollups · raw archive | **Raw archive, statements from final rows only** | Any bug can be fixed by recomputing, before the money moves |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Hot partitions | an album release, a viral track | Processor lag on a few tasks | Split hot keys into sub-keys, two-stage sum, show "data as of" |
| Double counting | upload retries, replay after a crash | Inflated plays and royalties | Dedup by play id, checkpointed state, absolute upserts |
| Late-play undercount | phones offline for hours | Streaming numbers too low | Late-plays metric, nightly recon from raw, provisional labels |
| Stream and recon disagree | the two paths drift apart | Numbers jump when a day goes final | Shared counting logic or replay through one job, diff alerts |
| Wrong statement | a bug found after the month closed | Artists paid the wrong amount | Recompute from raw, adjustment line on the next statement |
| Cardinality growth | new dimensions (device, playlist, city) | Rollups grow towards raw size | Review dimensions, top-N per artist, a warehouse over raw for the rest |
