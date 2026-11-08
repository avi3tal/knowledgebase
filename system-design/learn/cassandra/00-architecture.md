## Architecture at a glance

Before the data model, see the system an architect would draw. This is a fleet telematics
platform: 200 000 trucks report GPS and engine sensors every 10 seconds, dispatchers watch them
on a live map, a stream job raises maintenance alerts, and a separate analytics DC produces the
monthly fuel and route reports. The ingest API writes each reading once; Cassandra handles the
copies. Play the figure, then switch the tabs: the morning shift surge, the link to the other
region going down, and a node being added to the ring.

```figure
system-overview
```

### Zoom in: the write path of one reading

Watch when the ingest API gets its answer: after two local acks, while the other region is still
being updated. The tabs show a replica that is down (and the hint that covers it), a timeout
followed by a safe retry, and a late batch from a truck that lost its signal.

```figure
reading-write
```

### Zoom in: one truck's route over a time range

A time range for one truck is one partition thanks to the day bucket, read from two replicas
while only one of them sends the rows. The tabs show a range that crosses midnight, replicas
that disagree (and read repair), and a replica that stalls.

```figure
truck-range-read
```

### How it scales

The cluster grows by adding nodes, never by moving to a bigger box: three nodes, then a larger
rack-aware ring, then a second region, then a separate DC just for analytics.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Partition key | vehicle_id · (vehicle_id, day) · day | **(vehicle_id, day)**, clustered by timestamp, newest first | About 8 640 rows (a few MB) per partition; a range for one truck is one seek, and no partition grows forever |
| Live positions | range-read the time series · a separate latest_position table · an in-memory cache | **latest_position table**, one row per truck, overwritten on each reading | The map reads one small row per truck instead of slicing 200 000 partitions |
| Consistency | ONE · LOCAL_QUORUM · EACH_QUORUM | **LOCAL_QUORUM** for writes and reads | R + W > RF inside the DC, with no cross-region wait on the ingest path |
| Replication | RF 2 · RF 3 per DC | **RF 3 per serving DC**, RF 1 in analytics | Survives one node down per DC with quorum intact |
| Alerts | poll Cassandra on a timer · a stream job on the same readings | **Stream job** | Alerts need the last few minutes per truck as they happen; polling would scan partitions Cassandra isn't built to scan |
| Retention | delete old rows · TTL on every row, compaction by time window | **TTL + time-window compaction** | Whole SSTables expire together and are dropped without tombstone scans |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Hot partition | a faulty unit sends hundreds of readings per second | One replica set saturates; that truck's partition balloons | Per-device rate limit at ingest, the day bucket as a ceiling, alerts on partition size |
| Compaction debt | the morning surge or a large backfill | Reads touch many SSTables; map p99 climbs | Disk and CPU headroom, scale before known peaks, throttle backfills |
| Wrong device clock | a truck's clock drifts or resets | Readings land in the wrong day bucket or in the future | Validate timestamps at ingest, clamp to receive time beyond a tolerance |
| Late data in old windows | backlogs uploaded days later | Time-window compaction mixes old and new SSTables, and expiry stops dropping whole files | Cap how old an accepted reading may be; send older backlogs through a separate repair path |
| Stale cross-region read | a dispatcher served by the other region | Positions briefly behind, or missing during a link outage | Pin each fleet's dispatchers to its home region; repair after long outages |
| Analytics on serving nodes | a report job pointed at a serving DC | Full scans evict caches and slow the map | Separate analytics DC; DC-aware drivers and credentials that only reach it |
