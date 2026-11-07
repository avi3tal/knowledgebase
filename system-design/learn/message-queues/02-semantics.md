## Queue or log?

| | **queue** (work queue) | **log** (event stream) |
|---|---|---|
| after consumption | message is deleted on ack | message is **kept** for a retention period |
| consumers | competing workers share the messages | many independent consumer groups each read everything |
| replay | no | yes: rewind the offset and reprocess |
| ordering | best effort (or FIFO queues) | strict **per partition** |
| scaling | add workers | add partitions (consumers ≤ partitions per group) |
| great for | background jobs, task distribution | event sourcing, CDC, analytics feeds, fan-out to many services |

## Delivery semantics
- **At-most-once:** ack before processing. A crash loses the message. Fine for metrics you can
  afford to drop.
- **At-least-once:** ack **after** processing. A crash means redelivery, so **duplicates
  happen**. This is the usual default.
- **Exactly-once effect:** at-least-once delivery plus an **idempotent consumer**: dedupe by
  message id, upsert instead of insert, or use a conditional write. "Exactly-once delivery"
  end to end is mostly a marketing phrase. Design for idempotency.

## Retries and dead letters
A message whose handler keeps failing (bad payload, a bug, a permanently missing record) is a
**poison message**. If you retry it forever it blocks or burns the consumers. So:
- Retry with **exponential backoff** for transient errors.
- After N attempts, move it to a **dead-letter queue (DLQ)** for inspection, alerting and
  manual replay.

In the trace below, `b` fails once and then succeeds on retry, while `d` always fails and
lands in the DLQ after 3 attempts. Notice that `b` finishes **after** `c`: retries break
ordering.

## Back-pressure
If producers outpace consumers for a long time, the queue grows without bound: latency climbs
and memory or disk fills. Options are to autoscale consumers on queue depth, bound the queue
and make producers slow down or reject (pushing back to the client), or shed low-priority
work.
