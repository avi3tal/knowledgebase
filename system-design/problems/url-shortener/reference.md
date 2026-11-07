# Reference walkthrough: URL shortener

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
Two use cases carry the design: **shorten** (write) and **redirect** (read). The non-functional
requirements decide everything else: redirects are **read-heavy (~100:1)**, must be **fast** and
**highly available**, while writes can tolerate brief hiccups.

## 2. Estimates
100M links/month ≈ **40 writes/s** and ≈ **4,000 reads/s** (peak ≈ 10k). Five years of links ≈ 6B
records × 500 B ≈ **3 TB**: big for one machine's RAM, small for a sharded key-value store. Caching
the hottest 20% of a day's reads needs well under 200 GB of memory.

## 3. API and data
`POST /urls` creates a link (idempotent with an idempotency key); `GET /{code}` answers with a
redirect. One entity, `links(code → long_url, …)`, accessed only by key: a natural fit for a
key-value store sharded by code.

## 4. Evolving the design
- **v1:** client → service → one SQL database. It works, but the single database serves every
  redirect: the read-heavy requirement breaks it, and one server is a single point of failure.
- **v2:** a load balancer over stateless instances, a **read-through cache** for hot codes, a
  **sharded key-value store**, and an **ID range allocator** so instances never collide.
- **v3:** analytics leave the hot path: the service **emits click events to a stream**, and a
  worker aggregates them in batches.

## 5. Deep dives
- **Code generation.** Hashing needs collision handling; random codes need an existence check per
  write; a **counter leased in blocks + base62** never collides and is cheap. Shuffle bits if codes
  must not be sequential. 7 base62 characters give about 3.5 trillion codes.
- **301 vs 302.** A 301 is cached by browsers and CDNs (less load, invisible clicks); a 302 keeps
  every click visible. With analytics in scope, choose 302 and let the cache carry the load.

## 6. Wrap-up
Single points of failure: the allocator (lease big ranges), hot cache shards (replicate hot keys),
store primaries (replicas, multi-AZ). Watch p99 latency, cache hit ratio, 404/5xx rates and stream
lag. At 10× scale, add instances, cache shards and store partitions.

## Transferable pattern
**Read-heavy key → value lookup:** pay once on write (compact unique keys), serve reads from
cache/edge, push side effects onto a queue. The same shape shows up in pastebins, feature-flag
services, and DNS-like resolvers.
