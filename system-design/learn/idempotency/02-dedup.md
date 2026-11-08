## Getting it right under concurrency

The sketch in the intro has a race. Two retries arriving 5 ms apart both miss the lookup and
both charge. The fix is to **claim the key first**, with the database as the referee (the tabs
play out two concurrent retries, a reused key, and check-then-insert going wrong):

```figure
claim-decision
```

| outcome | when | answer |
|---|---|---|
| claim won | key is new | do the work, store the response, return it |
| replay | key exists, same hash, `done` | the stored response |
| in progress | key exists, same hash, `in_progress` | `409 Conflict`, retry later |
| misuse | key exists, different hash | `422`, key reused with another body |

- **Unique constraint, not check-then-insert:** `INSERT … ON CONFLICT DO NOTHING` on a
  [PostgreSQL](#/learn/system-design/postgresql) primary key, or a conditional put in a
  key-value store. Exactly one attempt wins the claim.
- **Atomic with the side effect:** if the work is a local database write, write the key and
  the result in **one transaction**. If it's an external call (a card processor), pass your key
  on to them as well, so the whole chain is idempotent, and stuck `in_progress` rows can be
  resolved by asking the processor what happened.
- **Scope keys** per client or merchant (`(merchant_id, key)`), so two tenants can't collide.

> [!PITFALL] The crash window
> "Charge, then save the key" as two separate steps: if the process dies in between, the key
> was never stored and the retry charges again. Claim first, finish second.

## Consumer-side dedup
A [message queue](#/learn/system-design/message-queues) with at-least-once delivery hands the
consumer the same message again after a crash or a lost ack. The consumer makes the effect
happen once. The tabs show an effect outside the transaction, an upsert instead of a dedup
table, and a window that is too short:

```figure
consumer-dedup
```

```figure
redelivery
```

There are three ways to make a redelivery harmless:

| approach | how | state | fits |
|---|---|---|---|
| dedup table | store `message_id` with the effect, skip ids seen | one row per id, TTL | any side effect |
| naturally idempotent write | upsert by id, `SET status = 'shipped'`, `WHERE version = 7` | none extra | state changes |
| sequence numbers | producer stamps `(producer_id, seq)`, broker drops seq ≤ last | one number per producer | ordered streams, idempotent producers |

> [!PROS] Dedup table
> - Works for anything, including increments and "send an email" that can't be rewritten as
>   upserts.

> [!CONS] Dedup table
> - It must commit in the **same transaction** as the effect, so the effect must live in the
>   same database, or you are back to the crash window.
> - It needs a TTL, and the TTL bounds how late a duplicate can still be caught.

The window must be longer than the longest gap before a duplicate shows up: client retry
horizon, queue redelivery, replay from a log.

> [!NUMBERS] Sizing the window
> events/s × window × id size = 60k × 3,600 s × 50 B ≈ **11 GB** for one hour. A day would be
> ~260 GB, so long windows usually key on a business id with natural expiry instead.

In the trace below the consumer remembers only the last 3 ids. `m2` is caught, but `m1` comes
back after its id has expired and is processed **twice**.
