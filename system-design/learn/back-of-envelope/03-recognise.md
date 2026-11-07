## When to estimate, and how much

**Do it when:**
- Right after scoping, before drawing boxes. The numbers decide the boxes.
- Before any "do we need X?" decision: sharding, caching, a CDN, a queue.
- When the interviewer gives you numbers. They gave them to you for a reason.

**Keep it short:** 3–5 minutes, 4–6 numbers. Skip numbers that won't change a decision.

**Look-alikes, and why they're different:**
- **Latency, throughput and availability** is about service-level targets (p99 latency,
  nines, SLOs) and how latency adds up along a path. Estimation sizes the load and storage you
  must carry.
- **The framework (sd-framework)** tells you **when** to estimate in the interview. This topic
  is **how**.
- Capacity numbers then point you at a building block: high read QPS on repeated data →
  **caching**, huge write volume or data size → **sharding**, heavy static egress → **CDN**.

**Interview pitfalls:**
- Precision theatre: 86 400 to five digits while the DAU is a guess. Round to 1e5 and say so.
- Mixing up bits and bytes (bandwidth is usually quoted in bits) or KB vs KiB. Close enough,
  but be consistent.
- Averages only: no peak factor.
- Forgetting replication and retention in storage, or estimating photos and metadata as one
  number.
- Computing numbers and never using them: always end with "therefore…".
