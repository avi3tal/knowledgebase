# Idempotency keys & dedup

> Pattern · Ideas: idempotency key, stored response, request fingerprint, dedup table, TTL

An operation is **idempotent** if doing it twice has the same effect as doing it once.
`SET balance = 70` is idempotent. `balance = balance - 30` is not. Networks force the issue:
when a request times out, the client **can't tell** whether the server never got it or did
the work and lost the reply. The only safe move is to retry, so the server must make retries
harmless.

```
client ──POST /pay $30──► server ──charge──► card network   ✓ charged
client ◄──── timeout ──── (reply lost)
client ──POST /pay $30──► server ──charge──► card network   ✓ charged AGAIN
```

At 1M payments a day with a 0.1% timeout-and-retry rate, that's **1 000 double charges a
day** without protection.

## The idempotency key
The client generates a unique key (a UUID) **once per logical operation** and sends it on
every attempt, e.g. an `Idempotency-Key` header. The server keeps a table:

```
idempotency_keys
 key (PK)  │ request_hash │ status       │ response            │ created_at
 7f3a…     │ sha256(body) │ done         │ 201 {payment_id: …} │ 10:02:11
```

```python
def pay(key, body):
    row = keys.get(key)
    if row:                           # seen before: replay, don't redo
        return row.response
    result = charge(body)             # the side effect, once
    keys.put(key, hash(body), result) # same transaction as the charge
    return result
```

The second attempt finds the key and gets back the **stored response**, byte for byte, so the
client can't tell it was a retry. Storage is cheap: 1M keys a day × ~500 B × a 24 h TTL is
about **0.5 GB**.

Step through it below. Seven requests arrive, but only three are distinct operations.
Duplicates are replayed from `keys`, and the reused key `k3` with a different amount is
rejected, so the `ledger` ends with 3 charges. The same stream with `use_key: false` (one of
the checks) charges 7 times.
