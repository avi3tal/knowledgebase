# Backpressure, Admission Control and Waiting Rooms

> Pattern · Ideas: bounded buffers, block vs drop vs pace, load shedding, admission at the edge

Every component has a maximum throughput. When work arrives faster than that for **longer than a
burst**, it has to go somewhere. An unbounded queue only postpones the failure: latency grows,
then memory or disk fills, then the process falls over and takes the queued work with it.

**Backpressure** means the overloaded part signals upstream to *send less*, so the system slows
down in a controlled way instead of collapsing.

```
producer 400/s ──► [ queue: max 1 000 ] ──► consumer 250/s

unbounded:  +150/s backlog → 1 min = 9 000 queued, 36 s wait, then out of memory
bounded:    full after ~7 s, then one of:
              block → the producer waits (TCP window, blocking put, pull-based consumers)
              drop  → excess rejected or shed (503 / 429, drop the oldest, sample)
              pace  → the producer is told the rate and sends at most 250/s
```

The rule behind it is **Little's law**: items in the system = arrival rate × time in system. With a
consumer capped at 250/s, a queue of 9 000 means 36 s of waiting for whatever is at the back.
Most clients time out long before that, so the system ends up doing work nobody is waiting for.
A queue should hold seconds of work, not minutes.

What each choice costs:
- **Block:** no work lost, but the delay moves upstream. If every hop blocks, the client
  sees it, and that's often the honest result.
- **Drop:** latency stays low and the service stays up, but work is lost. Acceptable for
  metrics samples, retriable requests and low-priority traffic.
- **Pace:** the producer adapts (credits, `Retry-After`, a token bucket at the source).
  Smoothest, but it needs a feedback channel and cooperative clients.

The trace below pushes 8 requests at a consumer that handles 2 per tick, through a queue of 3. With
`block`, the excess waits in `pending` at the producer. Nothing is lost, but it takes longer. The
checks run the same input with `drop` (3 requests shed) and `pace`.
