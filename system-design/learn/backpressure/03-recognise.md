## How to recognise you need it

**Strong signals:**
- A producer that can **outrun** its consumer for a long time, not just for a few seconds:
  crawlers, ingestion pipelines, fan-out jobs, batch imports.
- "What happens when the database / downstream is slow?" Without a bound, queues and memory grow
  until something crashes.
- A **known spike** far above capacity (launch, on-sale, flash sale) where fairness and a working
  core matter more than serving everyone at once.
- Rising latency with no errors at first, then timeouts everywhere: the classic sign of
  unbounded buffering.
- A must-not-fall-over core (payments, inventory) behind a very large public audience.

**Look-alikes, and why they're different:**
- **[Rate limiting](#/learn/system-design/rate-limiting)** enforces a **fixed quota per client**
  (100 req/min per API key), whatever the system's current health. Backpressure reacts to
  **current capacity** and applies to all traffic. A rate limiter is one tool it can use.
- **[Message queues](#/learn/system-design/message-queues)** absorb a **temporary** burst when all
  the work must eventually finish. If the overload is sustained, the queue itself needs a bound
  and a policy, and that's backpressure.
- **[Retries & DLQs](#/topic/system-design/retries-dlq)** handle **failed** work, one item at a
  time. Retries without backoff *add* load during an overload, so they make it worse.
- **[Circuit breakers](#/topic/system-design/circuit-breaker)** stop calling a dependency that is
  **failing**. Backpressure slows down for one that is **working but saturated**.

**Interview pitfalls:**
- "Just add a queue" with no maximum depth and no plan for when it's full.
- Bounding the queue but blocking the request thread forever. Give every wait a timeout.
- Shedding deep in the stack after the expensive work is done, instead of at the edge.
- Returning 503 without `Retry-After` and jitter, so clients come back all at once.
- Treating every request the same. Say what gets shed first.
- Forgetting the metric: queue depth or consumer lag, plus in-flight count against the limit.

**In our problems:**
- **rate-limiter-design**: the 429 response is the signal that tells callers to slow down.
- **job-scheduler**: a burst of jobs that all fall due at once must not swamp the executors.
- **web-crawler**: bounded stages between discovering, fetching and parsing keep a fast
  frontier from flooding the slower steps.
- **ticketmaster**: a huge on-sale spike meets a small, strongly consistent core, so admission
  is controlled at the edge.
- **message-queue**: decide how a slow consumer avoids being overrun, and what the broker itself
  must bound.
- **metrics-monitoring**: millions of agents push constantly, so decide what to buffer and what
  to shed when storage falls behind.
