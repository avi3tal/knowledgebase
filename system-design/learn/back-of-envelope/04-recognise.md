## When to estimate, and how much

**Do it when:**
- Right after scoping, before drawing boxes. The numbers decide the boxes.
- Before any "do we need X?" decision: sharding, caching, a CDN, a queue.
- When the interviewer gives you numbers. They gave them to you for a reason.

**Keep it short:** 3–5 minutes, 4–6 numbers. Skip numbers that won't change a decision.

| question | estimate | typical consequence |
|---|---|---|
| how much traffic? | read and write QPS, peak | LB + more app servers, cache, replicas |
| does it fit on one node? | total storage, row count | single DB vs sharding vs object storage |
| does the hot set fit in memory? | cache bytes | one cache node vs a cluster |
| how much leaves the building? | egress Gbps | CDN |
| is the write path the problem? | sustained writes/s | queue to absorb bursts, sharding for sustained load |

**Look-alikes, and why they're different:**
- **Latency, throughput and availability** is about service-level targets (p99 latency,
  nines, SLOs) and how latency adds up along a path. Estimation sizes the load and storage you
  must carry.
- **The framework (sd-framework)** tells you **when** to estimate in the interview. This topic
  is **how**.
- Capacity numbers then point you at a building block: high read QPS on repeated data →
  **caching**, huge write volume or data size → **sharding**, heavy static egress → **CDN**.

> [!PITFALL] Interview pitfalls
> - Mixing up bits and bytes (bandwidth is usually quoted in bits) or KB vs KiB. Close enough,
>   but be consistent.
> - Averages only, with no peak factor.
> - Forgetting replication and retention in storage, or estimating photos and metadata as one
>   number.
> - Computing numbers and never using them. Always end with "therefore…".

> [!INTERVIEW] When the interviewer says "don't bother with numbers"
> Skip the arithmetic but keep the conclusion: "I'll assume reads dominate by about 100 to 1
> and the data is in the terabytes, so I'll design for a cache and object storage." One sentence
> keeps every later box justified.
