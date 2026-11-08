## How to recognise you need it

**Strong signals:**
- A **non-idempotent write** that a client or a worker may retry: create a payment, place an
  order, send an email, book a seat, create a short link.
- "The user double-clicked", "the mobile app retries on timeout", "the webhook arrived twice".
- **At-least-once** delivery anywhere in the path: queues, logs, webhooks, cron re-runs.
- A requirement like "never charge twice" or "exactly-once counting".

**Anti-signals:**
- The operation is already idempotent: a `PUT` of a full document, a delete by id, a read.
  Adding a key table there is ceremony.
- Losing an occasional duplicate or an occasional event is fine (view counters, logs), and a
  dedup table would cost more than the error.

**Look-alikes, and why they're different:**
- **[Distributed locking](#/topic/system-design/distributed-locking)** stops two workers running
  the **same thing at the same time**. It doesn't remember that the job **already finished**,
  so a retry after the lock is released runs it again. Locks also expire, so the dedup record is
  what actually keeps you safe.
- **[Retries & DLQ](#/topic/system-design/retries-dlq)** is the reason duplicates happen. It
  decides when to try again. Idempotency is what makes trying again safe.
- **[Outbox pattern](#/topic/system-design/outbox-pattern)** makes "update the DB and publish an
  event" atomic on the producer side. Its relay publishes at-least-once, so consumers still need
  dedup.
- **[Optimistic concurrency](#/topic/system-design/optimistic-concurrency)** rejects writes
  based on a stale version (lost updates between **different** writers). Idempotency recognises
  the **same** request arriving twice.

> [!DIALOGUE] Scoping retries in a payment design
> **Candidate:** Can clients retry a payment request, for example on a mobile timeout?
> **Interviewer:** Yes, the app retries up to three times over about a minute.
> **Candidate:** Then the client sends an idempotency key per checkout, and I keep keys for a day, well past that horizon.
> **Interviewer:** What about the processor's webhooks?
> **Candidate:** Those are at-least-once too, so I dedupe on the processor's event id in the same transaction as the ledger write.

> [!INTERVIEW] What to say
> "Delivery is at-least-once everywhere, so I make every side effect idempotent: a
> client-chosen key claimed with a unique insert before the work, the response stored and
> replayed, and a dedup id committed with the effect on every consumer. That gives an
> exactly-once **effect**."

> [!PITFALL] Interview pitfalls
> - Check-then-insert without a unique constraint, which still races.
> - Storing the key **after** the side effect in a separate step. A crash in between means a
>   double charge on retry.
> - A server-generated key: it has to come from the client, and stay the same across retries.
> - No TTL, or a TTL shorter than the retry or replay horizon.
> - Claiming "exactly-once delivery". Say at-least-once plus dedup = exactly-once **effect**.

**In our problems:**
- **url-shortener:** a retried create must return the same short code, not mint a second one.
- **notification-system:** a retried send must not reach the user's phone twice.
- **job-scheduler:** a run that executes twice (timeouts, redelivery) must stay harmless.
- **message-queue:** producer retries must not append the same record to the log twice.
- **payment-system:** every hop, from the client to the processor's webhooks, must survive retries.
- **ad-click-aggregator:** duplicate click events must not inflate what advertisers are billed.
