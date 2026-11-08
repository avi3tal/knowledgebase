# Message Queues and Event Streaming

> Building block · Ideas: async decoupling, queues vs logs, delivery semantics, back-pressure, DLQs

In a synchronous call chain the caller waits for every step. If resizing an image takes 2 s and
notifying followers takes 1 s, the upload request takes 3 s, and it fails if either step is down.
A **message broker** sits between a **producer** and a **consumer**: the producer writes a
message and moves on, and the consumer processes it when it can.

```figure
async-upload
```

What you gain:
- **Decoupling in time:** the consumer can be slow, deploying or briefly down, and messages wait.
- **Load levelling:** a burst of 10 000 jobs becomes a steady stream at the rate the workers
  can handle. You size the workers for the average, not the peak.
- **Independent scaling:** add consumers when the queue grows.
- **Fan-out:** one event, many interested services, and the producer doesn't know any of them.

> [!PROS]
> - The request path only pays for one durable write (a few ms), not for the slowest step.
> - A failing consumer no longer fails the user's request. The work waits and is retried.

> [!CONS]
> - The caller doesn't get the result in the response. You need a status endpoint, a
>   notification, or a client that polls.
> - You now have to reason about **duplicates, ordering and failure** (the next section).
> - One more system to run and monitor.

## How big does the buffer get?
The queue absorbs the difference between the arrival rate and the processing rate:

```
backlog growth   = arrival rate − processing rate
time to drain    = backlog ÷ (processing rate − arrival rate after the burst)
wait at the back = backlog ÷ processing rate          (Little's law)
```

> [!NUMBERS] A flash sale
> Orders arrive at 1 500/s for 2 minutes. The workers handle 1 000/s. The backlog grows by
> 500/s to **60 000 messages**, and the last order waits 60 000 ÷ 1 000 = **60 s**. When
> traffic drops back to 400/s, the queue drains at 600/s, so it's empty **100 s** later. If 60 s
> of delay is acceptable, you don't need workers for the peak. If not, autoscale on queue depth.

> [!INTERVIEW] When to bring up a queue
> "The user doesn't need the result to continue, so I'll accept the request, write a job to a
> durable queue, return 202, and let a worker pool drain it. I'll monitor queue depth and the
> age of the oldest message, and autoscale the workers on them."

The trace below publishes a burst of 6 messages, then 3 more, while the consumer handles 2 per
tick. Watch `queue` grow and drain. Its depth is the lag you'd monitor.
