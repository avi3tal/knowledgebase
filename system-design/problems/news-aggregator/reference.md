# Solution: news aggregator

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The content is someone else's, and it is messy. Thousands of sources publish at their own pace, often
the same story many times. The system is a **pipeline**: ingest → normalise → group → rank. It turns
that noise into a few *shared* ranked lists that change every minute. The read path only serves those
lists and adds a small personal touch.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Ingest new articles from ~50k publishers' feeds and sitemaps |
| F2 | Group articles about one event into a story with "full coverage"; drop near-copies |
| F3 | Top stories per edition (country + language) and per topic, linking out |
| F4 | Personal "For you" section from followed topics and reading history |
| N1 | Page p99 < 200 ms; read-heavy, with ×5 spikes on breaking news |
| N2 | A breaking story appears within ~5 min of first publication |
| N3 | Reads stay available: stale lists beat errors |
| N4 | Polite crawling: never overload a publisher |

**Assumptions:** 2M articles/day; 100M DAU × 5 views. Metadata is ~5 KB per article, kept 1 year;
text is kept 30 days. **Out of scope:** search, comments, paywalls, payouts.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| articles | 2M / day | **23 /s** (bursts ~100 /s) |
| feed fetches | 50k sources / 300 s average interval | **170 /s** |
| page views | 100M × 5 / day | **5.8k /s**, **29k /s** on breaking news |
| metadata | 2M × 365 × 5 KB | **3.7 TB / year** |
| text for clustering | 2M × 30 × 20 KB | **1.2 TB** |

What the numbers say: ingest is *small* (23/s) but must be *fast*, so the pipeline is about
latency, not throughput. Reads are 250× larger and mostly identical per edition, so they should be
served from shared caches.

## 3. API and data model
- `GET /stories?edition=&topic=&cursor=` → `{stories[{story_id, headline, articles[3], coverage_count}]}`.
  It is anonymous and CDN-cached for ~30 s.
- `GET /for-you` is personalised and never edge-cached. `GET /stories/{id}` returns full coverage.
- `POST /events` accepts batched views and clicks and returns 202.

Data and where it lives:
- `articles(article_id, canonical_url unique, source_id, title, snippet, published_at, simhash,
  embedding, story_id)`: NoSQL, write-once.
- `stories(story_id, headline, centroid, article_ids, coverage_count, topic, editions, first_seen)`:
  NoSQL.
- `sources(feed_url, poll_interval, next_due, etag, authority)`: SQL; it is only 50k rows.
- Ranked lists `edition:topic → [story_id, score]`: Redis.
- Reader profiles (topic weights, seen stories): NoSQL.

## 4. Decompose: the parts

### Part P1: Ingestion: finding new articles (F1, N2, N4)
| option | pros | cons |
|---|---|---|
| fixed-interval polling of every feed | simple | late for wire services, wasteful for weekly blogs |
| **adaptive polling per source + WebSub push where offered** | fresh where it matters, few wasted fetches | per-source scheduler state |
| general crawl of publisher sites | finds articles without feeds | huge cost and slow discovery |

**Choice:** a scheduler keeps `next_due` per source and also accepts WebSub pings. Fetchers do
conditional GETs (ETag / If-Modified-Since) under per-host rate limits. New items go on a
**raw-articles stream**, so bursty fetching never waits for slower processing.

```diagram
part:P1
```

### Part P2: Dedup and story clustering (F2)
Two different problems: *copies* (syndication, the same text with different boilerplate) and *coverage*
(different texts about one event).

| option | pros | cons |
|---|---|---|
| exact hash of URL or body | cheap | misses copies with small edits |
| **SimHash/MinHash near-dup detection** | catches copies with O(1) band lookups | thresholds need tuning; can't group different write-ups |
| batch clustering every hour | good global clusters | a breaking story waits up to an hour |
| **incremental nearest-centroid on embeddings, plus an hourly batch re-cluster** | seconds of latency; quality repaired in batch | clusters merge and split, so ids must stay stable |

**Choice:** canonicalise the URL, then look up SimHash bands to drop copies. Each unique article is
compared with the centroids of stories from the last ~48 h. It joins the nearest if similar enough,
otherwise it starts a new story. At ~23 articles/s, that is one cheap approximate-nearest-neighbour
lookup each.

```diagram
part:P2
```

### Part P3: Ranking and personalisation (F3, F4)
| option | pros | cons |
|---|---|---|
| one global ranking | trivially cacheable | nothing personal |
| score every story per reader per request | fully personal | thousands of stories × 29k req/s; nothing shared |
| **two-stage: precomputed candidate lists, light per-reader re-rank** | shared work done once a minute; personal step is cheap | personalisation limited to the candidate pool |

**Choice:** every minute, a ranker scores recent stories on coverage count and its growth, source
authority, freshness decay and edition/topic. It writes the top 500 per list to Redis. A request
re-ranks a few hundred candidates by the reader's topic weights and drops stories already read.
Profiles are updated asynchronously from click events.

```diagram
part:P3
```

### Part P4: Serving the home page (F3, N1, N3)
| option | pros | cons |
|---|---|---|
| render from the stores per request | always current | every spike hits the database |
| precompute a page per reader | fast reads | 100M pages rebuilt every minute |
| **CDN-cached edition pages + stateless blend of cached lists for personal sections** | spikes absorbed at the edge | pages up to 30 s stale |

**Choice:** anonymous edition pages are cached at the CDN for ~30 s with request coalescing on
misses. Personalised sections go to a stateless news API behind a load balancer. A 30 s TTL is
invisible inside the 5-minute freshness budget.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** an hourly cron crawls every source into one database, and the site lists the newest
articles. It is an hour late, shows the same event 200 times, and every view hits the database.
```diagram
v1
```
**v2, compose P1:** adaptive scheduler, fetchers and the raw-articles stream. Articles arrive within
minutes, but each article is still its own card.
```diagram
v2
```
**v3, compose P2:** near-dup detection and incremental clustering, so the site lists stories.
Ordering is still newest-first, from the store.
```diagram
v3
```
**v4, compose P3 and P4:** the ranker precomputes lists per edition and topic. The CDN absorbs
anonymous traffic, and the news API blends "For you" from cached candidates and profiles fed by
click events.
```diagram
v4
```

## 6. Deep dives
- **Poll schedule.** Halve a source's interval when a fetch finds new items and double it when not,
  bounded to 1–60 min. WebSub pings jump the queue. A per-host token bucket keeps N4 even when many
  feeds share a host.
- **Stable story ids.** The hourly re-cluster may merge or split stories. Keep the older or larger id
  on a merge and leave a redirect, so shared links, ranked lists and reading history stay valid.
- **Breaking-news spike.** A 30 s TTL plus request coalescing means one origin fetch per edition
  page per TTL, however many readers arrive.
- **Idempotent ingest.** The same article arrives from the feed, the sitemap and a ping. The
  canonical URL is a unique key, so reprocessing is a no-op.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Kafka](#/topic/system-design/kafka) | raw-article and click-event streams | Pulsar, Kinesis |
| [Redis](#/topic/system-design/redis) | SimHash band index, ranked lists per edition/topic | Memcached (lists are awkward) |
| [Cassandra](#/topic/system-design/cassandra) | articles, stories, reader profiles | DynamoDB, Bigtable |
| [PostgreSQL](#/topic/system-design/postgresql) | the 50k-row sources table that drives the scheduler | any SQL |

## 8. Patterns
- [Backpressure](#/topic/system-design/backpressure): the stream absorbs fetch bursts while
  clustering catches up.
- [Pre-aggregation](#/topic/system-design/pre-aggregation): ranking is computed once a minute per
  list, not per request.
- [Hot keys](#/topic/system-design/hot-keys): one breaking story on every edition page.
- [Idempotency](#/topic/system-design/idempotency): canonical URLs make re-ingest harmless.
- The transferable shape is **many noisy producers → pipeline → few shared, precomputed views →
  thin personal layer**. Job boards, price comparison and app-store charts work the same way.

## 9. Evaluation
- **Bottlenecks:** the clusterer on big news days (partition by language), near-dup index memory
  (keep 48 h of bands), and CDN misses at TTL expiry (coalescing).
- **Failures:** the stream buffers fetches if processing lags. Pages keep serving the last lists
  (stale but up). Failing hosts get backoff. If clustering lags, articles appear as singletons and
  merge later.
- **Monitoring:** publish → visible latency for the top sources, fetch errors per host, stream lag,
  cluster size distribution (many singletons means threshold drift), page p99, CDN hit ratio.
- **The 30-second answer:** an adaptive scheduler (plus WebSub) drives polite fetchers that put
  articles on Kafka. Workers drop copies with SimHash and attach each article to the nearest recent
  story by embedding, with an hourly re-cluster. A ranker writes top lists per edition and topic to
  Redis every minute. Edition pages are CDN-cached for 30 s, and a stateless API re-ranks cached
  candidates for "For you".

## 10. Tips and common mistakes
- Don't design a general web crawler: feeds, sitemaps and push cover news far more cheaply.
- Dedup and clustering are different problems. Say which one each technique solves.
- Personalising every story for every reader at request time won't fit 200 ms. Precompute the shared
  part.
- Mention politeness. Hammering a small publisher's server is a real failure.

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [caching](#/learn/system-design/caching)
- [Stream processing](#/topic/system-design/stream-processing) and
  [probabilistic structures](#/topic/system-design/probabilistic-structures) (SimHash, MinHash)
- Related case studies: [web crawler](#/topic/system-design/web-crawler) and
  [news feed](#/topic/system-design/news-feed)
