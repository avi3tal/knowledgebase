# Rate Limiting

> Building block · Algorithms: token bucket, leaky bucket, fixed / sliding window

A rate limiter answers one question per request: **"has this caller used up their allowance
for now?"** If yes, reject the request cheaply (HTTP `429 Too Many Requests`, maybe with a
`Retry-After` header) instead of letting it reach expensive code.

Why you'd want one:
- **Protect capacity.** One buggy client in a retry loop shouldn't take the service down for
  everyone else.
- **Fairness and pricing.** Free tier gets 100 requests/min, paid tier 10 000.
- **Abuse and cost control.** Slow down login brute force, scraping and SMS spam. Every
  request you reject is one you never pay for downstream.

```figure
placement
```

What a client actually experiences with a limit of 2 requests per second:

```figure
three-requests
```

## The key: what you count
Every limiter has a **key**, such as user id, API key, IP or (user, endpoint), and a
**rule**, such as "10 requests per second per key". The algorithms differ in how they decide
whether one more request still fits the rule.

## Token bucket
Picture a bucket that holds at most `capacity` tokens and gains `refill_rate` tokens per
second. Each request takes one token, and an empty bucket means reject.

```figure
token-bucket-flow
```

> [!PROS]
> - Allows **short bursts** up to `capacity` while still enforcing a long-run average of
>   `refill_rate`. Real users are bursty (a page load fires 10 calls at once).
> - Tiny state: two numbers per key, `tokens` and `last_refill_time`. No timer needed:
>   refill **lazily** when a request arrives, using the time elapsed since the last one.

> [!CONS]
> - Two parameters to tune (`capacity`, `refill_rate`), and they interact.
> - A full bucket lets a burst hit the backend at once; if the backend can't take bursts, use a
>   leaky bucket instead.

Step through it below. Watch `tokens` drain during the burst at t=0, then come back one per
second.
