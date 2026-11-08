## Architecture at a glance

Before the key table, see the system an architect would draw. This is the checkout of a
food-delivery app: a phone on a shaky mobile network pays for an order, and the money must move
exactly once even though requests are retried and events are delivered more than once.
Play the figure, then switch the tabs: a dinner rush full of retries, an event published twice,
and a well-meant change to key retention.

```figure
system-overview
```

### Zoom in: the life of one key

Everything interesting about idempotency happens to a single key: it is claimed, worked under a
lease, finished with a stored response, replayed, and finally expired. Follow one key through,
then try the tabs: a crash mid-charge, a processor that never answers, and a double-tap.

```figure
key-lifecycle
```

### How it scales

The "have I seen this?" check moves as traffic grows: a table in the payments DB, then a
dedicated key store with a TTL, then keys owned by a home region, then dedup on the consumer side
of a partitioned stream.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Who makes the key | server · client per attempt · client per operation | **Client, once per operation** (the Pay tap) | Only the client knows two requests are the same intent; a per-attempt key dedups nothing |
| Where keys live | same DB as the payment · separate key store | **Same DB** first, a key store with TTL when key writes dominate | One transaction is the strongest guarantee; move only when the primary feels it |
| Retention | minutes · 24 h · 7+ days | **Longer than the longest client retry** (7 days here) | A key that expires before the last retry is no key at all |
| Duplicate in flight | block until done · 409 Retry-After · run both | **409 with Retry-After** under a lease | Doesn't pin connections, never runs the work twice, and a dead worker's lease runs out |
| Unknown downstream outcome | mark failed · mark done · keep pending | **Keep pending**, settle by webhook or status query | Both guesses are wrong in one of the two worlds |
| Event dedup | trust the broker · seen-id table · naturally idempotent writes | **Seen id in the same transaction as the effect**, upserts where possible | Delivery is at-least-once; the consumer is the only place that can make it effectively once |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Stuck in_progress | Worker dies after claiming | Every retry gets 409 forever | Lease with expiry, takeover by the next retry, a sweeper for old pending keys |
| Blind retry after a timeout | Processor doesn't answer | Double charge (new key) or lost revenue (marked failed) | Pass the key downstream, query status by key, wait for the webhook |
| Key forgotten too early | Short TTL or a key store that loses data on failover | Retries look new and charge again | TTL beyond the retry horizon, a durable store, UNIQUE(order_id) as a backstop |
| Key reused for a different request | Client bug reuses one key across carts | The wrong stored response is replayed | Store a request hash and answer 422 on mismatch |
| Duplicate events | Relay or consumer crashes between doing and recording | Points added twice, two emails | Outbox pattern on the producer, seen-id in the effect's transaction on the consumer |
| Dedup window too short | Topic replay older than the seen-id window | Old duplicates are processed again | Window ≥ retention of the source, drop old ids by whole partitions |
