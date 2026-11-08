## Architecture at a glance

Before partitions and offsets, see the system an architect would draw. This is a food-delivery
platform whose services talk through Kafka: orders enter through change data capture, couriers
stream their positions, a stream processor computes ETAs, and three consumer groups read the same
log for different jobs. Play the figure, then switch the tabs: the dinner rush, a bad indexer
deploy that has to be replayed, and a schema change.

```figure
system-overview
```

### Zoom in: who leads each partition

Every partition has one leader that takes its writes, and followers that copy it. Watch how the
leaders are spread over the brokers, then try the tabs: a broker dies, comes back, and the case
where no in-sync replica is left.

```figure
partition-leadership
```

### Zoom in: a consumer group rebalance

Scaling a consumer group means moving partitions between members, and every move is a pause for
those partitions. Watch how few partitions move when a third indexer joins, then compare the
eager protocol, a crashed member and a rolling deploy.

```figure
group-rebalance
```

### How it scales

The cluster grows in steps: one broker, then three brokers with replication, then more partitions
so the consumer groups can grow, then one cluster per region with mirroring.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| How orders get into Kafka | service writes DB and topic · outbox · CDC | **CDC from the orders DB** | One write per change; the topic can't disagree with the table |
| Partition key | none · order_id · restaurant_id | **order_id** (courier_id for locations) | Order per order, and keys spread evenly; a restaurant key would make hot partitions |
| Durability | acks=1 · acks=all + min ISR 2 | **acks=all, RF=3, min.insync.replicas=2** | Survives one broker loss without losing acknowledged records |
| Partition count | match today's consumers · plan for peak | **Plan for peak consumers** (48) | Partitions cap a group's parallelism, and adding them later moves keys |
| Schemas | free-form JSON · registry with compatibility | **Registry, backward compatible** | Breaking changes fail at deploy time, not in every consumer |
| Rebalance protocol | eager · cooperative + static membership | **Cooperative, static ids** | Scaling and deploys pause only the partitions that move |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Hot partition | one key (a huge restaurant) dominates | One consumer lags while others idle | A better key, or a salted key for that entity with ordering kept where needed |
| Consumer lag | slow sink at peak | Stale search, late notifications | Lag alerts per group, scale members up to the partition count |
| Duplicate processing | crash or rebalance before commit | Records handled twice | Idempotent sinks (upsert by id), commit after processing |
| Data loss on failover | acks=1, or an unclean leader election | Acknowledged records gone | acks=all, min ISR 2, unclean election off for important topics |
| Retention too short | a bug found after a week | Can't rebuild by replay | Retention sized to the time to detect a bug, plus an archive in the lake |
| Rebalance storm | handler slower than max.poll.interval | Members keep leaving and rejoining | Smaller batches, a longer poll interval, process off the polling thread |
