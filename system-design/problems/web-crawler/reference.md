# Reference walkthrough: web crawler

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
The loop: **take a URL → fetch → store → extract links → enqueue the new ones**, starting from
seeds. Around it: **don't repeat work** (URLs and duplicate content), **recrawl** to stay fresh,
and expose stored pages to indexing. The non-functional requirements shape everything: be
**polite** (≤ 1 request/s per host, honour robots.txt), hit **2B pages/month**, and survive
**traps, slow servers and crashes**.

## 2. Estimates
2B / month ≈ **770 pages/s** (~1,500 peak). At ~1 s per fetch that is about a thousand requests in
flight: async I/O across a modest fleet. Bandwidth ≈ 770 × 100 KB ≈ **0.6 Gbps**. Storage ≈ 2B ×
100 KB × 6 months ≈ **1.2 PB raw** (less after dropping copies and compressing): blob storage.
Seen-URL set: 20B URLs exactly would be ~1 TB of keys; a **Bloom filter at 1% false positives is
~25 GB** and fits in memory.

## 3. API and data
A small internal control API: `POST /seeds`, `PUT /hosts/{host}/policy`. Data: **url_meta**
(url_hash → host, priority, last_fetched, next_fetch_at, content_hash) in NoSQL; the **frontier**
(priority front queues → per-host back queues); and **raw pages** in blob storage, batched into
large files.

## 4. Evolving the design
- **v1:** one process with an in-memory BFS queue writing to SQL. Too slow, loses state on crash,
  hammers whichever site it's on, and the DB can't hold petabytes.
- **v2:** **durable frontier → async fetchers** (with a caching DNS resolver) → **blob storage**,
  plus **parser workers** that normalise links and drop seen URLs via a **Bloom filter**. Still a
  FIFO, so fetchers pile onto one host.
- **v3:** **priority front queues + per-host back queues** released by a **politeness scheduler**,
  a robots.txt cache, **SimHash** for near-duplicates, and a **recrawl scheduler** over url_meta.

## 5. Deep dives
- **Politeness.** A global FIFO is dominated by a few big sites, and per-fetcher sleeps don't
  coordinate. Per-host back queues with a "host ready at t" heap ensure one fetcher per host at a
  time with an enforced delay. Throughput then comes from breadth across hosts.
- **Dedup.** Normalise URLs (lowercase host, strip fragments and tracking params) and test against
  a Bloom filter (a false positive skips a new URL, which is acceptable). For content, an exact
  hash catches copies and SimHash catches near-copies.
- **Priority and freshness.** BFS with a fixed interval wastes budget. Use importance × staleness,
  with an adaptive revisit interval: shorter when the content hash changed, longer when it didn't.

## 6. Wrap-up
Bottlenecks: DNS, frontier and Bloom filter (shard by host / URL hash), and politeness itself.
Failures: leased URLs are redelivered when a fetcher dies; per-host backoff for sick hosts; depth,
URL-length and per-host page budgets against traps; frontier checkpoints. Watch pages/s, error
rates by host, frontier age, duplicate rate and DNS latency.

## Transferable pattern
**Self-feeding work pipeline with external politeness:** a prioritised frontier feeds per-target
queues that enforce rate limits on systems you don't own, stateless workers do the I/O, outputs land
in cheap bulk storage, and compact probabilistic sets stop the loop from redoing work. The same
shape fits link checkers, price scrapers, API backfills against third parties and sitemap
indexers.
