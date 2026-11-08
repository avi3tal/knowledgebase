## Where to push back

Backpressure works hop by hop, and every hop needs a **bound**. The figure's tabs follow a slow
database back up the chain, and show what a single unbounded hop does.

```figure
hop-bounds
```

- **Pull instead of push.** Consumers that fetch work (log consumers, job workers) can't be
  overrun. They simply lag, and the lag is the metric you alert on.
- **Bounded concurrency.** Cap in-flight requests per instance (e.g. 200). Requests beyond the cap
  wait briefly or get a fast 503. Adaptive limiters lower the cap when latency rises.
- **Credits / windows.** The receiver grants N items and the sender may not exceed them. TCP flow
  control, HTTP/2 stream windows and reactive streams' `request(n)` all work this way.

The tabs compare plain push, a lost credit grant and a slow receiver.

```figure
credits
```
- **Deadlines.** Pass a timeout down the call chain and drop work whose caller has already given
  up. It stops wasted work during overload.

## Shedding well
When you must drop, choose what to drop:
- **Priority:** keep checkout, drop recommendations. Keep paid tenants, throttle free ones.
- **Newest vs oldest:** for interactive traffic, drop the *oldest* (that caller has probably given
  up). LIFO under overload keeps p50 healthy.
- **Shed early and cheaply:** a 429 at the edge costs microseconds. Timing out deep in the stack
  wastes every hop on the way.
- Tell clients **when** to come back (`Retry-After`) and make them retry with jitter. Otherwise
  the drop becomes a retry storm.

## Admission control and waiting rooms
For a known spike, like a product launch, an on-sale or registration opening, demand can be
100–1000× capacity for minutes. Instead of letting everyone hit the core and fail randomly:
- Put users in a **virtual waiting room** at the edge (a cheap static page plus a FIFO in a fast
  store).
- Release them at the rate the core can sustain, e.g. 2 000 users/min, each with a signed,
  short-lived **admission token** that the core checks.
- Show **position and ETA**. People wait far more calmly when they can see progress.
- Bound the line too. Past it, say "try later" rather than promising a wait you can't deliver.

```figure
waiting-room
```

> [!NUMBERS] Sizing a waiting room
> 1 000 000 people arrive in the first minute of an on-sale. The core can serve 2 000 users/min.
> The last person in a full-size line would wait 1 000 000 ÷ 2 000 = **500 min**, over 8 hours.
> If tickets run out after 50 000 buyers, cap the line at about 50 000 (a 25 min ETA) and tell
> everyone else straight away that it has sold out.

In the trace below, 9 users arrive at a room that admits 2 per tick and holds 4. Each user gets an
ETA when they join, users `u5` and `u8` are turned away, and the service behind it never sees more
than 2 per tick.
