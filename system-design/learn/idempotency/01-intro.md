# Idempotency keys & dedup

> Pattern · Ideas: idempotency key, stored response, request fingerprint, dedup table, TTL

An operation is **idempotent** if doing it twice has the same effect as doing it once.
`SET balance = 70` is idempotent. `balance = balance - 30` is not. Networks force the issue:
when a request times out, the client **can't tell** whether the server never got it or did
the work and lost the reply. The only safe move is to retry, so the server must make retries
harmless.

```figure
double-charge
```

> [!NUMBERS] What "rare" retries cost
> 1M payments/day × 0.1% timeout-and-retry rate = **1 000 double charges a day**, each one a
> support ticket and a refund. Retries are not an edge case at scale; they are steady traffic.

## The idempotency key
The client generates a unique key (a UUID) **once per logical operation**, for example when
the user presses *Pay*, and sends it on every attempt in an `Idempotency-Key` header. The
server remembers each key with the response it produced. The tabs replay it for a retry that
arrives while the first attempt is still running, a key reused with another body, and a TTL that
is too short:

```figure
key-replay
```

The table behind it is small and boring, which is the point:

| column | example | why it's there |
|---|---|---|
| `key` (unique) | `7f3a…` | the referee: only one insert can win |
| `request_hash` | `sha256(body)` | catches a key reused with a different body |
| `status` | `in_progress` / `done` | tells a retry whether to wait or replay |
| `response` | `201 {payment_id: pay_42}` | replayed byte for byte |
| `created_at` | `10:02:11` | drives the TTL clean-up |

The simplest version of the handler:

```python
def pay(key, body):
    row = keys.get(key)
    if row:                           # seen before: replay, don't redo
        return row.response
    result = charge(body)             # the side effect, once
    keys.put(key, hash(body), result) # same transaction as the charge
    return result
```

The second attempt finds the key and gets back the **stored response**, so the client can't
tell it was a retry. This sketch still has a race (two retries 5 ms apart both miss the
lookup); the next section fixes it.

> [!NUMBERS] Storage for the key table
> keys/day × row size × TTL = 1M × ~500 B × 1 day ≈ **0.5 GB**. Even a 7-day TTL is 3.5 GB:
> one small indexed table, not a new system.

> [!TIP]
> The key must come from the **client** and stay the same across retries. A key the server
> generates per request is new on every attempt, so it can never match.

Step through it below. Seven requests arrive, but only three are distinct operations.
Duplicates are replayed from `keys`, and the reused key `k3` with a different amount is
rejected, so the `ledger` ends with 3 charges. The same stream with `use_key: false` (one of
the checks) charges 7 times.
