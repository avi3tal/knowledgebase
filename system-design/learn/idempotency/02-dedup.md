## Getting it right under concurrency

The sketch in the intro has a race. Two retries arriving 5 ms apart both miss the lookup and
both charge. The fix is to **claim the key first**, with the database as the referee:

```
1. INSERT INTO idempotency_keys(key, request_hash, status) VALUES (?, ?, 'in_progress')
      ── unique violation? ──► row is 'done'        → return stored response
                               row is 'in_progress' → 409 "retry later"
                               hash differs         → 422 "key reused with another body"
2. do the work (charge)
3. UPDATE … SET status='done', response=? WHERE key=?
```

- **Unique constraint, not check-then-insert:** `INSERT … ON CONFLICT DO NOTHING` on a
  [PostgreSQL](#/learn/system-design/postgresql) primary key, or a conditional put in a
  key-value store. Exactly one attempt wins the claim.
- **Fingerprint the request:** the same key with a different amount is a client bug. Reject
  it rather than replaying the wrong answer.
- **Atomic with the side effect:** if the work is a local database write, write the key and
  the result in **one transaction**. If it's an external call (a card processor), pass your key
  on to them as well, so the whole chain is idempotent, and stuck `in_progress` rows can be
  resolved by asking the processor what happened.
- **Scope keys** per client or merchant (`(merchant_id, key)`), so two tenants can't collide.

## Consumer-side dedup
A [message queue](#/learn/system-design/message-queues) with at-least-once delivery hands the
consumer the same message again after a crash or a lost ack. The consumer makes the effect
happen once:
- **Dedup table:** store each processed `message_id` (or a business id such as
  `order_id`+`event`) in the same transaction as the effect, and skip ids already seen.
- **Naturally idempotent writes:** upsert by id, `SET status = 'shipped'`, or a conditional
  write `WHERE version = 7`, so replaying them changes nothing.
- **Sequence numbers:** a producer stamps `(producer_id, seq)` and the broker drops any seq it
  has already stored, which is how idempotent producers work.

The dedup table can't grow forever, so it has a **TTL or window**. That window must be longer
than the longest gap before a duplicate shows up: client retry horizon, queue redelivery,
replay from a log. At 60k events/s, an hour of 50-byte ids is ~11 GB.

In the trace below the consumer remembers only the last 3 ids. `m2` is caught, but `m1` comes
back after its id has expired and is processed **twice**.
