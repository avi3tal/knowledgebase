# Backpressure, Admission Control and Waiting Rooms

> Pattern · Ideas: bounded buffers, block vs drop vs pace, load shedding, admission at the edge

Every component has a maximum throughput. When work arrives faster than that for **longer than a
burst**, it has to go somewhere. An unbounded queue only postpones the failure: latency grows,
then memory or disk fills, then the process falls over and takes the queued work with it.

**Backpressure** means the overloaded part signals upstream to *send less*, so the system slows
down in a controlled way instead of collapsing.

```figure
bounded-queue
```

> [!NUMBERS] The same overload, with and without a bound
> - Backlog growth: 400/s in − 250/s out = **150/s**.
> - Unbounded, after 1 minute: 150 × 60 = **9 000** items queued, a wait of 9 000 ÷ 250 = **36 s**
>   at the back, and it keeps growing until memory runs out.
> - Bounded at 1 000: full after 1 000 ÷ 150 ≈ **7 s**, and the worst wait is capped at
>   1 000 ÷ 250 = **4 s**.

The rule behind it is **Little's law**: items in the system = arrival rate × time in system. With a
consumer capped at 250/s, a queue of 9 000 means 36 s of waiting for whatever is at the back.
Most clients time out long before that, so the system ends up doing work nobody is waiting for.
A queue should hold seconds of work, not minutes.

## Block, drop or pace

```figure
when-full
```

| | work lost? | latency for the caller | needs | good for |
|---|---|---|---|---|
| **block** | no | grows: the delay moves upstream | a timeout on every wait | writes that must happen, internal pipelines |
| **drop / shed** | yes | stays low | a choice of what to drop, `Retry-After` | metrics samples, retriable requests, low priority |
| **pace** | no | smooth | a feedback channel, cooperative senders | producers you control, streaming protocols |

> [!PROS]
> - **Block** is the honest default inside a pipeline: nothing is lost, and if every hop
>   blocks, the client sees the slowdown.
> - **Pace** gives the smoothest result, since the sender never overshoots.

> [!CONS]
> - **Block** without a timeout ties up threads and connections until everything stalls.
> - **Drop** loses work, so it needs a policy for *which* work.
> - **Pace** only works with senders that listen (credits, `Retry-After`, a token bucket at
>   the source).

The trace below pushes 8 requests at a consumer that handles 2 per tick, through a queue of 3. With
`block`, the excess waits in `pending` at the producer. Nothing is lost, but it takes longer. The
checks run the same input with `drop` (3 requests shed) and `pace`.
