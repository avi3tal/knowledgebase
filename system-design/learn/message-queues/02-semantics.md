## Queue or log?

Brokers come in two shapes. A **queue** hands each message to one worker and forgets it. A
**log** keeps every message and lets each reader track its own position.

```figure
queue-vs-log
```

| | **queue** (work queue) | **log** (event stream) |
|---|---|---|
| after consumption | message is deleted on ack | message is **kept** for a retention period |
| consumers | competing workers share the messages | many independent consumer groups each read everything |
| replay | no | yes: rewind the offset and reprocess |
| ordering | best effort (or FIFO queues) | strict **per partition** |
| per-message retry / delay | yes, built in | no: a slow record holds up its partition |
| scaling | add workers | add partitions (consumers ≤ partitions per group) |
| great for | background jobs, task distribution | event sourcing, CDC, analytics feeds, fan-out to many services |
| examples | SQS, RabbitMQ | Kafka, Kinesis, Pulsar |

## Delivery semantics
What happens on a crash depends on **when the consumer acks**:

| | ack when? | after a crash | duplicates? | use for |
|---|---|---|---|---|
| **at-most-once** | before processing | message is lost | never | metrics, logs you can afford to drop |
| **at-least-once** | after processing | message is redelivered | **yes** | the usual default |
| **exactly-once effect** | after processing, with dedupe | redelivered, applied once | delivered twice, applied once | payments, counters, anything with side effects |

The tabs show the same crash with a non-idempotent consumer, the ack-first alternative, and a handler slower than the visibility timeout.

```figure
redelivery
```

> [!PITFALL] "Exactly-once delivery"
> End to end, across a network, it's mostly a marketing phrase. What you can build is
> at-least-once delivery plus an **idempotent consumer**: dedupe by message id, upsert instead
> of insert, or make the write conditional (`UPDATE … WHERE version = 7`).

## Retries and dead letters
A message whose handler keeps failing (bad payload, a bug, a permanently missing record) is a
**poison message**. If you retry it forever it blocks or burns the consumers.

The tabs walk a transient error, classifying errors before retrying, and what happens with no attempt cap.

```figure
retry-dlq
```

> [!TIP]
> Retry only what can succeed later: timeouts, 503s, lock conflicts. A validation error will
> fail the same way every time, so send it to the DLQ right away. Alert on DLQ depth, not just
> on errors.

## Back-pressure
If producers outpace consumers for a long time, the queue grows without bound: latency climbs
and memory or disk fills. You can autoscale consumers on queue depth, bound the queue and make
producers slow down or reject (pushing back to the client), or shed low-priority work. The
[backpressure](#/learn/system-design/backpressure) lesson covers each option.

In the trace below, `b` fails once and then succeeds on retry, while `d` always fails and
lands in the DLQ after 3 attempts. Notice that `b` finishes **after** `c`: retries break
ordering.
