## Architecture at a glance

Before partitions and offsets, see the system an architect would draw. This is an airline
operations event platform: flight-ops publishes every delay and gate change, bookings arrive through
change data capture, crew scheduling publishes duty rosters, a stream processor joins delays with
bookings to find passengers who will miss their connection, and four consumer groups read the same
log for different jobs. Play the figure, then switch the tabs: a storm at a hub, an SMS vendor
outage, and a new schema field.

```figure
system-overview
```

### Zoom in: who leads each partition

Every partition has one leader that takes its writes, and followers that copy it; the KRaft
controller quorum decides who leads. Watch how the leaders are spread over the brokers, then try
the tabs: a broker loses power, catches up when it returns, and the case where the in-sync replica
set shrinks to one.

```figure
leader-election
```

### Zoom in: a consumer group rebalance

Scaling a consumer group means moving partitions between members, and every move is a pause for
those partitions. Watch how few partitions move when a third notifier joins, then compare the
eager protocol, a crashed member and a rolling deploy.

```figure
group-scale-out
```

### How it scales

The cluster grows in steps: one broker, then three brokers with replication, then more partitions
so the busy consumer groups can grow, then one cluster per region with mirroring between them.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| How bookings get into Kafka | booking service writes DB and topic · outbox table · CDC | **CDC from the bookings DB** | One write per change, and the topic can never disagree with the table |
| Partition key | airport · flight number · flight leg (flight + date) | **Flight leg** for flight-status, and for bookings (one record per booked segment, re-keyed by the connector) | Order per leg, and a hub storm spreads over many legs; an airport key would make one hot partition |
| Joining delays with bookings | co-partitioned topics · repartition step · replicated global table | **Co-partitioned**: same key, same partition count | The join stays local to one task with no extra hop; cost: both topics must be resized together |
| Durability | acks=1 · acks=all + min ISR 2 | **acks=all, RF=3, min.insync.replicas=2** | A lost gate change strands passengers; this survives one broker loss without losing acknowledged records |
| Schemas | free-form JSON · registry with compatibility checks | **Registry, backward compatible** | A breaking change fails at deploy time, not in four consumer groups at once |
| Rebalance protocol | eager · cooperative + static membership | **Cooperative, static ids** | Scaling out in a storm and rolling deploys pause only the partitions that move |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Hot partition | keying by airport, or one leg with a flood of updates | One member lags while the others idle | Key by leg; consumers that need an airport view filter or re-key downstream |
| Consumer lag | slow vendor or a burst of misconnects | Passengers hear about a gate change too late | Per-group lag alerts, scale members up to the partition count, a retry topic for failed sends |
| Duplicate processing | crash or rebalance before the offset commit | The same SMS sent twice | Commit after sending, and dedupe on event id in a send log |
| Data loss on failover | acks=1, or an unclean leader election | An acknowledged status change is gone | acks=all, min ISR 2, unclean election off, alerts on under-replicated partitions |
| Silent join misses | topics with different keys or partition counts | Misconnected passengers never found | Check co-partitioning at startup, or add an explicit repartition step |
| Regional failover | consumers move to the other region's cluster | Records skipped or processed twice | Translated offsets from mirror checkpoints, idempotent consumers |
