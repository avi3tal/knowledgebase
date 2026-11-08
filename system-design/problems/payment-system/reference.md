# Solution: payment system

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Throughput is small (about a thousand payments per second at peak). The hard part is **exactly-once
effects over unreliable calls**. Every hop can time out with an unknown outcome: merchant → us,
us → processor, processor → our webhook. The design must turn those uncertain hops into a correct,
auditable record of money. The tools are:
- idempotency keys at every hop;
- a persisted state machine;
- an outbox for side effects;
- a double-entry ledger;
- reconciliation as the final safety net.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | A merchant creates a payment: charge a customer's payment method |
| F2 | Payment status queries and webhooks on every state change |
| F3 | Refunds; merchant balances tracked for payouts |
| F4 | Daily reconciliation with the processor's settlement reports |
| N1 | Exactly-once effect: no retry ever charges twice |
| N2 | Correctness over availability: a balanced, immutable ledger, auditable to the cent |
| N3 | 99.99% available API; p99 < 3 s including the processor |
| N4 | 7-year financial history |

**Assumptions:** 10M payments/day, ~10× peak, ~6 ledger entries per payment over its life, card
data tokenized by the PSP. **Out of scope:** fraud scoring, FX, card network internals.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| payments | 10M / 86,400 s | **120 /s** (peak ~1,200) |
| PSP calls in flight | 1,200 /s × 2 s (Little's law) | **~2,400** |
| ledger entries | 10M × 6 | **60M / day** |
| ledger storage | 60M × 200 B × 365 | **4.4 TB / year** (~30 TB for 7 years) |
| merchant webhooks | 120 /s × 3 events | **~350 /s** |

A single Postgres primary per shard can take this write rate, so scale doesn't force exotic storage.
What the numbers do show is that **thousands of slow external calls are always open**. Timeouts are
a normal event, not an edge case, so the design is driven by what happens on a timeout.

## 3. API and data model
- `POST /payments {amount, currency, payment_method, order_id}` + `Idempotency-Key` → `201 {payment_id,
  status}`, or `202` while pending.
- `GET /payments/{id}` → status, amount, refunds.
- `POST /payments/{id}/refunds {amount?}` + `Idempotency-Key` → `201 {refund_id, status}`.
- `POST /psp/webhooks` → the signed processor event, deduplicated by PSP event id.

| entity | key fields | store |
|---|---|---|
| `payments` | payment_id, merchant_id, amount, currency, status, psp_ref, version | Postgres, sharded by merchant |
| `idempotency_keys` | (merchant_id, key) unique, request_hash, state, response | same DB, same transaction |
| `outbox` | event_id, payment_id, type, payload | same DB, same transaction |
| `ledger_entries` | txn_id, account_id, debit/credit, amount, source_event_id (unique) | ledger Postgres, append-only |
| `accounts` | account_id, type, cached_balance, as_of_entry | ledger Postgres |
| settlement files | raw PSP reports, recon results | S3 |

## 4. Decompose: the parts
Five sub-problems, one per place where money could be lost or duplicated.

### Part P1: Idempotent payment API (F1, N1)
| option | pros | cons |
|---|---|---|
| no idempotency | nothing to build | every timeout risks a double charge |
| dedupe on (merchant, order_id) | no client change | blocks legitimate repeat charges |
| keys in Redis | fast | lost on failover; not atomic with the payment |
| **key table in Postgres, same transaction as the payment** | atomic, durable, replays the stored response | one unique-index write per request |

**Choice:** `(merchant_id, Idempotency-Key)` is unique and stored with the request hash and the final
response. A replay of a finished request returns the stored response. The same key while the first
attempt is still in flight returns 409, and the same key with a different body returns 422.

```diagram
part:P1
```

### Part P2: Payment state machine and PSP calls with retries (F1, F2, N1, N3)
| option | pros | cons |
|---|---|---|
| call the PSP synchronously and retry blindly | simple | timeout + retry = double charge; no record of attempts |
| **persisted state machine; PSP idempotency key = our payment_id; backoff queue; status query for unknowns** | every retry is safe; crash-recoverable | more states and a worker pool |

**Choice:** `created → pending → succeeded | failed`, plus `unknown`. The state is written **before**
each external call. The PSP gets our `payment_id` as its idempotency key, so any retry repeats the
same charge request and the PSP deduplicates it. A fast path waits for the PSP within the request
timeout. On a timeout or a retryable error, the payment goes to a backoff queue (with a DLQ after
N tries), and executors resolve unknowns by querying the PSP. Webhooks arrive through the gateway
and move the same state machine.

```diagram
part:P2
```

### Part P3: Double-entry ledger (F3, N2, N4)
| option | pros | cons |
|---|---|---|
| mutable balance column | fast reads | no history; bugs silently corrupt money |
| single-entry log | some history | no invariant: money can appear from nowhere |
| **double-entry, append-only; balances derived** | debits = credits always; full audit | more rows; corrections are new entries |

**Choice:** every money movement is a transaction of entries that sum to zero. For example, a $100
charge with a $3 fee posts: debit `psp_receivable` 100, credit `merchant_balance` 97, credit `fees`
3. Entries are never updated. A unique `source_event_id` makes the poster exactly-once in effect.
Balances are cached per account with the last entry they include.

```diagram
part:P3
```

### Part P4: Reconciliation with the processor (F4, N2)
| option | pros | cons |
|---|---|---|
| trust our own records | nothing to build | lost webhooks and PSP errors go unnoticed |
| trust webhooks in real time | fast | lost, duplicated and reordered |
| **daily batch: settlement file vs ledger** | independent of every online component | up to a day late |

**Choice:** a scheduled job downloads the settlement file to S3. It matches each line to ledger
entries by `psp_ref` and amount and classifies breaks: missing on our side, missing at the PSP,
amount mismatch, timing. Known classes are auto-resolved with correcting entries, and the rest go
to finance. About 10M lines a day is a small batch.

```diagram
part:P4
```

### Part P5: Events and merchant webhooks via the outbox (F2, N1)
| option | pros | cons |
|---|---|---|
| write the DB, then publish (dual write) | simple | a crash in between loses or duplicates events |
| **transactional outbox → relay → Kafka; consumers dedupe by event id** | events commit with state | a relay; slight latency |

**Choice:** the outbox row commits with the state change. The relay publishes it to Kafka,
partitioned by payment_id so each payment's events stay in order. The ledger poster and the webhook
dispatcher consume the stream. Webhooks are signed and retried with backoff, and merchants dedupe
by event id.

```diagram
part:P5
```

## 5. Reduce: the high-level design
Merge the parts by node id, one problem at a time:

**v1, naive:** one app updates a balance column and calls the processor inline. A timeout + retry
double charges, a crash loses the record, and nobody can explain a balance.
```diagram
v1
```
**v2, compose P1 and P2:** the gateway, idempotency keys committed with the payment, and the
state machine with safe PSP retries.
```diagram
v2
```
**v3, compose P3 and P5:** outbox → Kafka → the double-entry ledger and merchant webhooks.
```diagram
v3
```
**v4, compose P4:** daily reconciliation against the processor's settlement file.
```diagram
v4
```

## 6. Deep dives
- **Timeouts are not failures.** After a PSP timeout, the payment is `unknown`, and the merchant
  gets `202 pending`. Resolve it by querying the PSP with our `payment_id`, or by the webhook. Only
  ever retry with the same key. Marking it failed and letting the merchant retry with a new
  payment is how customers get charged twice.
- **Ledger posting without 2PC.** A distributed transaction across the payments DB and the ledger
  blocks on the coordinator. A dual write loses postings on crashes. The outbox plus a unique
  `source_event_id` gives exactly-once effect with only local transactions. The cost is a ledger
  that lags by seconds, which is fine: nobody pays out in real time.
- **Corrections.** Never update or delete an entry. Post a reversal and a correct entry, so any
  balance can be replayed as of any date.
- **Hot accounts.** Every payment credits `fees` and debits `psp_receivable`. Split hot accounts
  into N sub-accounts and sum them when reading.
- **Refunds and payouts** are more transactions on the same state machine and ledger. A refund can
  never exceed the captured amount minus earlier refunds, which is checked in the same transaction.
- **Multi-step flows** (authorize → capture → payout) form a saga. Each step has a compensating
  action (void, refund) instead of a global rollback.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [PostgreSQL](#/topic/system-design/postgresql) | payments, idempotency keys, outbox, ledger | MySQL; Spanner/CockroachDB for multi-region |
| [Kafka](#/topic/system-design/kafka) | ordered payment events to the ledger and webhooks | SQS FIFO, Pulsar |
| [Object storage](#/topic/system-design/object-storage) | settlement files and reconciliation reports | a data warehouse |
| [Load balancers & proxies](#/topic/system-design/envoy-nginx) | gateway: TLS, merchant auth, per-merchant rate limits | a managed API gateway |

## 8. Patterns
- [Idempotency keys](#/topic/system-design/idempotency) at every hop: merchant → us, us → PSP, events
  → consumers.
- [Retries, backoff & DLQ](#/topic/system-design/retries-dlq) for the PSP calls and the webhooks.
- [Transactional outbox](#/topic/system-design/outbox-pattern) so state and events commit together.
- [Sagas](#/topic/system-design/saga) for authorize → capture → payout, with refunds and voids as
  compensations.
- [Event sourcing](#/topic/system-design/event-sourcing): the ledger is an append-only log, and
  balances are derived from it.
- The transferable shape is **exactly-once effects over unreliable calls**. Persist intent before
  each side effect, make every hop idempotent, publish through an outbox, record value as balanced
  entries, and reconcile with the outside world. Wallets, order processing and inventory transfers
  use it too.

## 9. Evaluation
- **Bottlenecks:** the processor (latency, rate limits; mitigated by a second PSP), hot merchant
  shards in a flash sale, and hot ledger accounts (sub-accounts).
- **Failures:** if the PSP is down, a circuit breaker opens, new payments go to a second PSP, and
  pending ones retry with backoff. A lost webhook is caught by status polling and reconciliation.
  If the ledger is down, events wait in Kafka.
- **Monitoring:** success/decline rate per PSP, payments stuck in pending/unknown, retry queue and
  DLQ size, relay and poster lag, **ledger imbalance (must be 0)**, and reconciliation breaks.
- **The 30-second answer:** an idempotency key is committed in the same Postgres transaction as the
  payment row. A persisted state machine calls the PSP with our payment_id as its idempotency key.
  Timeouts become "unknown" and are resolved by status queries and webhooks, never by blind
  re-charges. Retries go through a backoff queue with a DLQ. State changes leave through an outbox
  to Kafka, which feeds an append-only double-entry ledger (idempotent by event id) and signed
  merchant webhooks. A daily job reconciles the ledger with the PSP's settlement file.

## 10. Tips and common mistakes
- Don't lead with throughput. Lead with "every call can time out with an unknown outcome".
- "Retry on failure" without an idempotency key is a double-charge bug.
- A `balance` column is not a ledger. Say double-entry and append-only.
- Don't write the DB and publish to Kafka as two steps. Use the outbox.
- Don't skip reconciliation: it is the only check independent of your own code.

## 11. Learn more
- [Message queues and event streaming](#/learn/system-design/message-queues)
- [Distributed transactions](#/topic/system-design/distributed-transactions) and
  [CAP and consistency models](#/topic/system-design/cap-consistency)
- [Rate limiting](#/learn/system-design/rate-limiting) for the per-merchant limits at the gateway
- [Ticket booking](#/design/system-design/ticketmaster), which uses this payment flow at the end of
  checkout
