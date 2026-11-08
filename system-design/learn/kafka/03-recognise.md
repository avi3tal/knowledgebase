## How to recognise you need it

**Strong signals:**
- **High-volume event streams**: clicks, metrics, logs, location pings, chat messages. Tens of
  thousands to millions of events per second.
- **Several independent consumers** of the same events (billing, search, analytics, alerts),
  each at its own pace, added over time without touching the producer.
- **Replay**: reprocess the last N days after a bug fix, backfill a new index, rebuild a cache.
- **Per-entity ordering** (all events of one order, chat or device in sequence) at a scale where
  one global queue can't keep up.
- A durable **buffer between ingestion and storage**, so a slow database doesn't push back on
  clients.

**Look-alikes, and why they're different:**
- **[Message queues](#/learn/system-design/message-queues)** is the general idea. Kafka is one
  log-style implementation of it. If the question is just "do this in the background", the
  generic answer is enough.
- **[Task queues](#/topic/system-design/task-queues)** (SQS, RabbitMQ, Celery) suit jobs with
  per-message acks, retries, delays and priorities. Kafka has none of those per record. A slow
  record blocks its whole partition.
- **[Stream processing](#/topic/system-design/stream-processing)** (Flink, Kafka Streams) is the
  computation: windows, joins, aggregations. Kafka only stores and moves the events.
- **[Change data capture](#/topic/system-design/change-data-capture)** is about *getting* database
  changes out as events. Kafka is often where they land.
- **[Event sourcing](#/topic/system-design/event-sourcing)** makes events the source of truth for
  state. Kafka can carry them, but its retention isn't a permanent database by default.

**Interview pitfalls:**
- Promising global ordering. Say which **key** gives the ordering you need, and accept that there
  is none across keys.
- More consumers than partitions: the extra ones sit idle.
- Ignoring rebalances and at-least-once redelivery. Name the idempotency key.
- Choosing a key with skew (one celebrity, one huge tenant) and creating a hot partition.
- Using Kafka for request/response or for per-job retries and delays. Use a task queue.
- Not sizing retention × throughput × replication, or forgetting that the partition count is
  hard to change.

**In our problems:**
- **chat-system**: the durable stream between accepting a message and delivering it, with the
  ordering a conversation needs.
- **notification-system**: separates "an event happened" from per-channel senders that can be
  slow or failing.
- **live-comments**: a hot write stream that both storage and live delivery depend on.
- **metrics-monitoring**: absorbs collector spikes so the time-series store can write at its
  own pace.
- **ad-click-aggregator**: the replayable source of click events that aggregation and
  reconciliation read from.
- **message-queue**: you design this system yourself: partitions, replication and consumer
  offsets.
