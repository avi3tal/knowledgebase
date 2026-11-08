## Architecture at a glance

Before the mechanics, see the system an architect would draw. This is an online shop's order
pipeline: checkout only records the order and publishes one event, and payment, stock and email
happen behind a queue. Play the figure, then switch the tabs: a flash sale, the payment provider
going down, and a rolling deploy of the workers.

```figure
system-overview
```

### Zoom in: the life of one message

Every guarantee a queue gives comes from one rule: a message is deleted only when a worker acks
it. Watch where the message is at each moment, then try the tabs for a timeout, a crashed worker
and a message that can never succeed.

```figure
message-lifecycle
```

### How it scales

The design changes as the shop grows: synchronous calls, then one queue with a worker pool, then
a queue per concern with autoscaled consumers, then partitioned queues when order per entity
matters.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| What checkout waits for | every side effect · one durable publish | **One transaction + publish** (outbox) | Fast response, and a down provider no longer fails the order |
| How the event reaches the queue | publish after commit · outbox relay | **Outbox relay** | The order row and the event commit together, so neither is ever lost alone |
| When to ack | on receive · after the effect | **After the effect** | A crash means a redelivery, not a lost order (at-least-once) |
| Duplicates | hope they're rare · idempotent handlers | **Idempotency key = order id** | Redeliveries are normal; the effect must be safe to repeat |
| Failed messages | retry now · backoff · park | **Backoff with jitter, then DLQ after 5** | Rides out short outages without hammering, and isolates poison messages |
| Queue layout | one shared queue · one per concern | **One subscription per concern** | A slow email provider can't hold up payments |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Double effect | a redelivery after a worker restart | An effect applied twice | Provider idempotency key, a processed-ids table in the same transaction |
| Growing backlog | consumers slower than producers for hours | Orders confirmed minutes late | Alert on age of oldest message, autoscale within downstream limits |
| Poison message | payload no handler can process | Endless retries, wasted capacity | Max attempts, DLQ with an alert, a redrive tool after the fix |
| Retry storm | a dependency recovers and every retry fires at once | It falls over again | Exponential backoff with jitter, a cap on concurrent retries |
| Lost event | publish fails after the order commits | Order never paid or shipped | Outbox table plus relay, or change data capture from the orders table |
| Out-of-order events | "cancelled" processed before "paid" | Refund logic runs on the wrong state | Key by order id (FIFO group or partition), or version checks in the handler |
