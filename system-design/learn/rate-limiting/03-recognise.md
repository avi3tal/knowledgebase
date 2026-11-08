## Where it runs, and going distributed

**Placement:**
- **API gateway / edge:** one place for every service. It's the usual answer.
- **Middleware in each service:** the service knows more (user tier, cost of the endpoint).
- **Client side:** nice to have, but never trust it.

**Many limiter instances, one shared count.** With 20 gateway nodes behind a load balancer, the
counters must live in a shared fast store (an in-memory KV), or each node must enforce
`limit / 20` locally.

```figure
distributed
```

- Read-then-write races allow too much. Use an **atomic** increment, or a small script that
  checks and decrements in one round trip:

```figure
race
```

- Every request now pays a network hop. Options are to batch or sync counts asynchronously,
  accepting a little overshoot, or to keep a local token bucket that leases tokens from the
  central store in chunks.
- **Fail open or fail closed** when the counter store is down? For most APIs, fail open: let
  traffic through and alert. For login or payment abuse protection, fail closed.

**Tell the client:** return `429`, plus `Retry-After` and remaining-quota headers, so
well-behaved clients back off instead of hammering.

## How to recognise you need it

**Strong signals:**
- "Prevent abuse", "per user / per API key quota", "free vs paid tier", "protect the service
  from a noisy client".
- Expensive or dangerous endpoints: login, OTP/SMS send, search, LLM calls.
- A fragile downstream with a known maximum throughput.

**Look-alikes, and why they're different:**
- **Load balancing** spreads traffic **across** servers. It never says no. A limiter decides
  **whether** a request is served at all.
- **Message queues** absorb a burst and process it **later**. Use one when every request must
  eventually succeed. A limiter rejects **now** and the client retries.
- **Caching** reduces the cost of each repeated read. It doesn't cap how many requests a
  client may make.
- **Back-pressure** inside a pipeline (bounded queues, consumers pulling) is the internal
  cousin. Rate limiting is the policy at the edge, per client.

> [!DIALOGUE] Scoping a rate limiter in the interview
> **Candidate:** Is this a server-side limiter for our API, or client-side throttling?
> **Interviewer:** Server-side, in front of our public API.
> **Candidate:** What do we limit by: user id, API key or IP? Different rules per endpoint?
> **Interviewer:** Per API key, and the login endpoint gets a much stricter rule.
> **Candidate:** How many gateway nodes, and what's the traffic?
> **Interviewer:** About 20 nodes, 50 000 requests per second at peak.
> **Candidate:** Then the counters have to be shared and atomic, and I'll decide fail-open vs fail-closed per endpoint.

> [!PITFALL] Interview pitfalls
> - Naming an algorithm without saying **what the key is** and **where the counter lives**.
> - Ignoring the race between "read count" and "write count" across instances.
> - Forgetting the response contract (429 + Retry-After) and the fail-open/closed decision.
> - Using a fixed window and not mentioning the boundary burst.
