# Solution: web crawler

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The crawler is a **loop that feeds itself**: every page it fetches produces the next URLs. Its main
limit is not its own capacity but **other people's servers** (1 request/s per host). Throughput
therefore comes from breadth across hosts, not from speed against any one of them. Two more things
dominate the design:
- with 20B URLs and a third of pages duplicated, cheap "seen it already" tests matter as much as the
  fetching;
- the web is hostile, so every loop needs a budget.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | From seeds: fetch HTML, store it, extract links, enqueue new URLs |
| F2 | Fetch each URL once per cycle; don't store or index duplicate content twice |
| F3 | Recrawl, more often for pages that change often |
| F4 | Keep raw pages for 6 months for the indexing team |
| N1 | Polite: ≤ 1 request/s per host, obey robots.txt |
| N2 | 2B pages/month, scaling out by adding fetchers |
| N3 | Robust to traps, slow servers and crashes; no lost work |

**Assumptions:** about 100 KB per page, about 1/3 of pages are copies, about 20B URLs discovered over
time. **Out of scope:** images and video, JavaScript rendering, and building the index.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| fetch rate | 2B ÷ 2.6M s | **770 /s** (peak ~1,500) |
| fetches in flight | 1,500 /s × ~1 s each | **~1,500** concurrent |
| bandwidth | 770 × 100 KB × 8 | **0.6 Gbps** |
| raw storage, 6 months | 2B × 100 KB × 6 | **1.2 PB** (~800 TB without copies) |
| seen-URL set | 20B × 10 bits (Bloom, 1% FP) | **25 GB** (an exact set would be ~1 TB) |

The numbers point to async I/O, blob storage and a Bloom filter. The politeness limit means at least
~1,500 different hosts must be in flight at peak.

## 3. API and data model
- `POST /seeds {urls[], priority}` → `202`. This is internal, and also forces a recrawl.
- `PUT /hosts/{host}/policy {max_rps, enabled}` lets operators slow down or block a site after a
  complaint.
- `url_meta(url_hash PK, url, host, priority, last_fetched, next_fetch_at, content_hash, depth)` is
  stored in a wide-column store and drives recrawl.
- The frontier has priority front queues and per-host back queues, plus a heap of `(host, ready_at)`.
  It is persisted with checkpoints.
- `pages` are compressed HTML and headers, batched into large WARC-style files in blob storage and
  indexed by `url_hash → (file, offset)`.

## 4. Decompose: the parts
Five sub-problems. Each owns one hard requirement.

### Part P1: URL frontier, politeness and priority (F1, N1, N2)
| option | pros | cons |
|---|---|---|
| one global FIFO | simple | links cluster by site, so many fetchers hit one host |
| FIFO + per-fetcher sleep | easy | two fetchers can still hit the same host |
| **priority front queues → per-host back queues + ready-time heap** | politeness by construction; important pages first | more machinery; shard by host |

**Choice:** URLs enter priority queues. A politeness scheduler moves them into one back queue per host
and hands a host to a fetcher only when its `ready_at` has passed (1 s, or the robots.txt crawl-delay).
robots.txt is fetched once per host and cached.

```diagram
part:P1
```

### Part P2: Fetchers and DNS (F1, N2, N3)
| option | pros | cons |
|---|---|---|
| thread per fetch, OS resolver | simple | ~1,500 threads; the blocking resolver is the bottleneck |
| **async fetchers + caching DNS resolver** | thousands of fetches in flight per box | async code; must honour DNS TTLs |
| headless browser | renders JavaScript | 10–100× the cost; out of scope |

**Choice:** async HTTP fetchers that **lease** URLs (redelivered if not acked), strict connect and read
timeouts, and a local caching resolver. DNS lookups often cost 10–200 ms, so caching them matters as
much as the download.

```diagram
part:P2
```

### Part P3: Dedup, seen URLs and duplicate content (F2)
| option | pros | cons |
|---|---|---|
| exact URL set in a DB | exact | ~1 TB and a lookup for every link |
| **Bloom filter over normalised URLs** | 25 GB in memory | 1% of new URLs wrongly skipped |
| **content hash + SimHash** | catches copies and near-copies | near-duplicate search needs band indexing |

**Choice:** first normalise each URL: lowercase the host, drop fragments and tracking parameters, and
sort query parameters. Then test it against the Bloom filter. For content, an exact hash catches
copies and SimHash catches near-copies. A false positive only skips a new URL, which is a cheap
mistake.

```diagram
part:P3
```

### Part P4: Parsing and content storage (F1, F4)
| option | pros | cons |
|---|---|---|
| pages as DB rows | queryable | petabytes of blobs in a DB |
| one object per page | simple keys | billions of tiny objects; slow bulk reads |
| **batched WARC-style files in blob storage + parse queue** | cheap, sequential reads for indexing | needs a `(file, offset)` index |

**Choice:** fetchers append pages to large files and publish a "page fetched" event. Parsers consume
the events at their own pace, so a parsing backlog never slows fetching.

```diagram
part:P4
```

### Part P5: Recrawl scheduling and freshness (F3)
| option | pros | cons |
|---|---|---|
| fixed interval for every page | simple | wastes budget on static pages; news goes stale |
| **importance × staleness, adaptive interval** | budget follows value and change rate | needs per-URL history |
| sitemaps / change feeds only | exact signals | most sites don't publish them |

**Choice:** if a page's content hash changed, halve its interval; if not, double it, up to a cap. A
recrawl scheduler scans `url_meta` for due pages and re-enqueues them with their priority.

```diagram
part:P5
```

## 5. Reduce: the high-level design
**v1, naive:** one process with an in-memory BFS queue writing to SQL. It is too slow, it loses state
on a crash, it hammers one site at a time, and SQL can't hold 1.2 PB.
```diagram
v1
```
**v2, compose P2 and P4:** a durable frontier, async fetchers with DNS caching, batched pages in blob
storage, and parsers behind a queue. The loop still re-enqueues every link it sees.
```diagram
v2
```
**v3, compose P3:** a Bloom filter and content fingerprints stop the loop from redoing work.
```diagram
v3
```
**v4, compose P1 and P5:** per-host back queues and a politeness scheduler enforce N1, and `url_meta`
plus a recrawl scheduler keep pages fresh.
```diagram
v4
```

## 6. Deep dives
- **Crawler traps.** Endless calendars and session-id URLs are unbounded URL spaces. Cap the depth, the
  URL length and the pages per host per cycle. Demote hosts whose "new" pages are mostly SimHash
  near-duplicates.
- **Fetcher crash.** A URL is leased with a timeout and acked only after its page is stored. A crash
  means a refetch, never a loss, and content dedup absorbs the duplicate.
- **Near-duplicates fast.** Split the 64-bit SimHash into 4 bands of 16 bits and index each band. Two
  pages within Hamming distance 3 must share a band, so a band lookup finds every candidate.
- **Frontier sharding.** Shard the frontier by host hash, so one host's queue and `ready_at` live on
  one shard and politeness needs no cross-shard coordination.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Kafka](#/topic/system-design/kafka) | durable front queues and fetched-page events | a custom disk-backed queue, SQS |
| [Object storage](#/topic/system-design/object-storage) | batched WARC files of raw pages | HDFS |
| [Cassandra](#/topic/system-design/cassandra) | `url_meta` and content fingerprints | HBase, DynamoDB |
| [Redis](#/topic/system-design/redis) | robots.txt cache, the per-host ready-time heap | in-process maps on each frontier shard |

## 8. Patterns
- [Backpressure](#/topic/system-design/backpressure): queues between frontier, fetchers and parsers let
  each stage run at its own speed.
- [Retries and DLQs](#/topic/system-design/retries-dlq): leases, per-host exponential backoff, and
  parking hosts that keep failing.
- [Chunking and dedup](#/topic/system-design/chunking-dedup): content fingerprints skip stored copies.
- [Probabilistic structures](#/topic/system-design/probabilistic-structures): a Bloom filter for 20B
  URLs.
- The transferable shape is a **self-feeding work pipeline with external politeness**. A prioritised
  frontier feeds per-target queues that respect limits on systems you don't own, stateless workers do
  the I/O, results land in bulk storage, and compact sets stop repeated work. Link checkers, price
  scrapers and third-party API backfills have the same shape.

## 9. Evaluation
- **Bottlenecks:** DNS (cache it), the frontier (shard by host), the Bloom filter (partition by URL
  hash), and politeness itself: a few huge sites cap throughput, so breadth across hosts matters.
- **Failures:** if a fetcher dies, its leases expire and its URLs return. A sick host gets exponential
  backoff. Traps hit their budgets. A lost frontier shard is rebuilt from its checkpoint plus
  `url_meta`.
- **Monitoring:** pages/s, errors and timeouts per host, frontier size and age, duplicate rate,
  robots.txt denials, DNS latency and bandwidth.
- **The 30-second answer:** a frontier of priority queues feeds per-host back queues, released by a
  scheduler at ≤ 1 request/s per host. Async fetchers with cached DNS store pages in batched blob
  files. Parsers behind a queue normalise links, drop seen URLs with a Bloom filter, and drop copied
  content with hashes and SimHash. `url_meta` drives an adaptive recrawl. Budgets per host stop traps.

## 10. Tips and common mistakes
- Saying "add more fetchers" without politeness only hammers the same hosts faster.
- Separate URL dedup (before fetching) from content dedup (after fetching): they answer different
  questions.
- Estimate the seen-set memory before choosing a store; the Bloom filter answer follows from it.
- Mention traps and robots.txt without being asked. Interviewers listen for them.
- Don't put petabytes of HTML in a database.

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [sharding](#/learn/system-design/sharding)
- [Probabilistic structures](#/topic/system-design/probabilistic-structures) and
  [blob storage](#/topic/system-design/blob-storage)
- [Rate limiting](#/learn/system-design/rate-limiting): politeness is rate limiting turned outward
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
