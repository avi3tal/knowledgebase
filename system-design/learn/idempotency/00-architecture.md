## Architecture at a glance

Before the key table, see the system an architect would draw. This is a warehouse's inventory and
shipping backend: orders reserve stock through an Inventory API, fulfilment buys shipping labels
from an outside carrier, and events tell the warehouse floor and the customer what happened. Calls
time out and get retried, events arrive more than once, and still each unit must be reserved once
and each parcel must get one label.
Play the figure, then switch the tabs: a flash sale full of retries, a database failover, and a
deploy that quietly breaks the keys.

```figure
system-overview
```

### Zoom in: one key on the Inventory API

A reserve call is claimed under a lease, does its work, and leaves a stored reply behind. Every
later request with that key is answered from the key row: replay, 409 while the owner is still
working, or 422 when the body has changed. Follow the first request, then try the tabs.

```figure
reserve-key-flow
```

### Zoom in: the label call when the reply is lost

The carrier is outside your transaction. When the purchase times out you don't know whether a
label was bought, so look it up by your own reference before buying again.

```figure
label-lost-reply
```

### How it scales

The "have I seen this key?" check moves as traffic grows: a table in the inventory DB, then a
dedicated key store with a TTL, then keys owned by a home region, then dedup per partition on the
consumer side of the stream.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Who makes the key | server · client per HTTP attempt · client per operation | **Order service, once per order line** | Only the caller knows two calls are the same reservation; a key per attempt dedups nothing |
| Where keys live | inventory DB · separate key store | **Inventory DB** first, a key store with TTL when key writes crowd the primary | Key, reservation and outbox row in one transaction can't disagree, even across a failover |
| Request in flight | wait for the owner · 409 Retry-After · let both run | **409 with Retry-After**, the owner holds a lease | No connection waits on a hot row, the work never runs twice, a dead owner's lease expires |
| Outside call with an unknown outcome | buy again · mark failed · look up by reference | **Look up by reference**, then buy with the same reference | Buying again risks two labels, giving up risks none; only the carrier knows |
| Event delivery | trust the broker · seen-id table · naturally idempotent writes | **Seen id in the same transaction as the effect**, upserts where possible | The relay and the stream are at-least-once; only the consumer can make it effectively once |
| Safety net | none · unique constraints · reconciliation | **Both**: UNIQUE(order_id, line) and a nightly invoice check | Keys fail through bugs and expiry; the backstop and the reconciler catch what they miss |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Key stuck in progress | Owner dies after the claim | Every retry gets 409 until someone steps in | Lease with expiry, takeover by the next retry, alert on old in-progress keys |
| Two labels for one parcel | Carrier reply lost, purchase retried blind | Billed for a label nobody uses | Send a shipment reference, look it up before retrying, reconcile invoices |
| Key born per attempt | Key built inside the retry loop | Retries reserve stock twice | Key from order and line, UNIQUE backstop, a test that forces a timeout |
| Key reused for another request | Cart edit keeps the old key | A stale reply for the wrong quantity | Store a body hash, answer 422 on mismatch |
| Keys expire too soon | TTL shorter than the slowest retry or queue backlog | Late retries look new | TTL beyond the retry horizon, durable key store, unique constraint |
| Seen ids dropped before replays | Dedup window shorter than stream retention | Old pick tasks and emails sent again | Window ≥ retention, drop old ids by whole time partitions |
