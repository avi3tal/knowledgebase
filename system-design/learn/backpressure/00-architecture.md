## Architecture at a glance

Before the strategies, see the system an architect would draw. This is a concert ticketing
platform on sale day: demand outruns checkout by orders of magnitude, so every layer has a limit
and a policy for when it's reached. Play the figure, then switch the tabs: the on-sale spike, a
payment provider that slows down, and an operator who "fixes" the errors by raising the bound.

```figure
system-overview
```

### Zoom in: the admission decision

The cheapest place to say no is before any work is done. Follow the three questions the Checkout
API asks about every order, then try the tabs: a full queue, workers that slow down, and a buyer
who already holds seats.

```figure
admission-check
```

### Zoom in: workers pull with credit

Inside the core, the workers set the pace. Watch how the number of free slots decides how much a
worker takes, then compare a slow payment provider, a broker that pushes instead, and a
connection pool that runs dry.

```figure
worker-pull
```

### How it scales

The design changes as the pressure grows: one unbounded buffer, then a bound with fast
rejections, then consumers that autoscale on queue depth, then a pipeline of bounded stages.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Where the crowd waits | in the API's queue · at the edge | **Waiting room at the edge** | A fan in line costs a cached page, not a thread or a queue slot |
| Queue bound | unbounded · minutes · seconds of work | **About 20 s of work** | Anything older would outlive the client's timeout |
| When the queue is full | block · drop silently · reject with a hint | **503 + Retry-After** | The caller learns at once and backs off; nothing hangs |
| How workers get work | broker pushes · workers pull with a limit | **Pull with 5 in flight** | A slow worker takes less by itself; no hidden buffers |
| What to shed first | everything equally · by priority | **Optional work first** (recommendations, emails) | Keep capacity for buyers who are finishing a sale |
| Admit rate | fixed · driven by load signals | **From depth, age and p99** | Follows what the core can actually do right now |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Hidden unbounded buffer | a thread pool, socket or client queue without a limit | Memory grows until a crash | Audit every hop for a bound and a full-policy |
| Bound set too high | operator raises it to stop errors | Work done for callers who left | Bound in seconds of work, drop expired items, alert instead |
| Retry storm | clients retry 503s immediately | Load multiplies while overloaded | Retry-After, client backoff with jitter, a retry budget |
| Slow dependency | payment latency 10× | Slots stay busy, the queue fills | Timeouts, a circuit breaker, shed earlier via the admit rate |
| Unfair line | bots open many sessions | Real fans wait longer | One token per verified session, bot detection at the edge |
| Expired holds | a later stage stays slow | Seats locked by orders nobody pays | Hold TTLs, release on timeout, bound each stage separately |
