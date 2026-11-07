# Message Queues and Event Streaming

> Building block · Ideas: async decoupling, queues vs logs, delivery semantics, back-pressure, DLQs

In a synchronous call chain, the caller waits for every step, and if any step is slow or down,
the whole request is too. A **message broker** sits between a **producer** and a
**consumer**: the producer writes a message and moves on, and the consumer processes it when
it can.

```
before:  API ──sync──► resize image ──sync──► notify followers      (user waits for all of it)

after:   API ──► [ queue ] ──► resize workers ──► [ queue ] ──► notifier
          │
          └──► 202 Accepted  (user is done in milliseconds)
```

What you gain:
- **Decoupling in time:** the consumer can be slow, deploying or briefly down, and messages wait.
- **Load levelling:** a burst of 10 000 jobs becomes a steady stream at the rate the workers
  can handle. You size the workers for the average, not the peak.
- **Independent scaling:** add consumers when the queue grows.
- **Fan-out:** one event, many interested services, and the producer doesn't know any of them.

The cost is that the work is **asynchronous**. The caller doesn't get the result in the
response, and you now have to reason about duplicates, ordering and failure.

The trace below publishes a burst of 6 messages, then 3 more, while the consumer handles 2 per
tick. Watch `queue` grow and drain. Its depth is the lag you'd monitor.
