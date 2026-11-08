# Solution: post search

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Search is a **derived read model**. The posts store is the truth, and the inverted index is a copy
shaped for one question: *which posts contain these words?*

Two things make social search hard:
- **Freshness:** a post must be findable in seconds, and people search hardest during live events.
- **Size:** five years of posts is a ~270 TB index that every query might touch.

Both are handled by tiering the index by time and querying it with scatter-gather.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Search public posts by keywords, phrases, hashtags |
| F2 | "Top" (relevance + engagement + recency) and "Latest" (newest first), paginated |
| F3 | Likes and reposts influence "Top" |
| F4 | Deleted or hidden posts vanish from results within ~1 min |
| N1 | Search p99 < 500 ms, including ×5 event spikes |
| N2 | A new post is searchable within ~10 s |
| N3 | Data growth and query growth scale independently |

**Assumptions:** 500M posts/day with ~30 terms each; 200M searches/day; 5 years searchable, but ~80%
of queries need only the last week; 5B likes and reposts per day. **Out of scope:** people search,
typeahead, ads, social-graph personalisation, private posts.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| posts | 500M / day | **5.8k /s** (peak ~15k) |
| searches | 200M / day × 5 spike | **2.3k /s**, **12k /s** in events |
| searchable posts | 500M × 365 × 5 | **~900 billion** |
| index | 900B × ~300 B of postings | **~270 TB** |
| real-time tier | 7 days × 500M × ~600 B | **~2 TB**, fits in RAM across a few dozen nodes |
| engagement | 5B / day | **~58k /s** |

What the numbers say:
- 270 TB must be sharded, and query load needs replicas on top of that, so the two scale separately.
- The last week is tiny by comparison and answers most queries.
- 58k engagement events/s must not turn into 58k index rewrites/s.

## 3. API and data model
- `GET /search?q=&mode=top|latest&since=&cursor=` → `{posts[], next_cursor}`. The cursor encodes the
  last `(score, post_id)` for Top, or the last time for Latest.
- `POST /posts` and `DELETE /posts/{id}` belong to the post service. Each emits an event.

Data and where it lives:
- `posts(post_id time-sortable, author_id, text, lang, created_at, visibility)`: NoSQL. This is the
  source of truth, and every index can be rebuilt from it.
- **Inverted index**: term → posting list of post_ids (newest first) plus positions for phrases.
  Postings are stored in immutable segments per shard and per time tier, each with a deleted-docs
  bitset.
- Engagement signals (post_id → likes, reposts): a cache, read only for the top candidates.

## 4. Decompose: the parts

### Part P1: Ingestion pipeline (F1, F4, N2)
| option | pros | cons |
|---|---|---|
| post service writes the index synchronously | instantly searchable | index slowness or outages hit posting; the dual write diverges |
| hourly batch reindex | efficient | misses the 10 s target |
| **outbox/CDC events → stream → indexer workers** | posting never waits; replayable; deletes use the same path | seconds of lag, one more system |

**Choice:** the post service writes the post and an outbox row. A relay publishes created and deleted
events to Kafka, partitioned by post_id. Indexers tokenize and normalise the text (language, case,
hashtags), then add the document or a tombstone to the real-time index.

```diagram
part:P1
```

### Part P2: Index partitioning and replication (N1, N3)
| option | pros | cons |
|---|---|---|
| term-partitioned (a shard owns words) | a one-word query touches one shard | one post writes ~30 shards; hot terms melt a shard; multi-word queries join across shards |
| document-partitioned (a shard owns posts) | one shard per write; shards independent | every query fans out to all shards |
| **document-partitioned inside time tiers, replicated** | queries touch only the tiers in their time range; old tiers are immutable | tier boundaries and a daily build |

**Choice:** three tiers. The **real-time** tier holds the last 7 days in memory. The **recent** tier
holds about a year on SSD. The **archive** holds the rest on disk-heavy nodes. Within a tier, posts
are hashed to shards. A daily builder reads a day of posts and publishes immutable segments. Data
growth adds shards; query growth adds replicas.

```diagram
part:P2
```

### Part P3: Query fan-out and ranking (F2, N1)
| option | pros | cons |
|---|---|---|
| query every shard and wait for all | complete | latency = the slowest of hundreds of shards |
| **scatter-gather with per-shard top-k, timeouts, hedged requests** | bounded tail, partial results | may miss a slow shard's hits |
| **two-phase ranking: cheap per-shard score, broker re-ranks the top ~1000** | expensive features only on few candidates | bounded by first-phase recall |

**Choice:** a stateless broker parses the query and picks tiers. "Latest" starts at the real-time tier
and stops early once it has a page. "Top" fans out to the tiers in range. Each shard returns its top-k
by text match × recency, and the broker merges them and re-ranks with engagement. Hot queries are
served from a 10–30 s result cache with request coalescing.

```diagram
part:P3
```

### Part P4: Recency: fresh posts and fresh signals (F3, N2)
| option | pros | cons |
|---|---|---|
| reindex the document on every like | one store | ~58k rewrites/s; segment churn |
| **in-memory real-time tier (≈1 s refresh) + separate signals store** | new posts visible in seconds; likes are cheap counter updates | two lookups per ranked candidate |
| batch-built segments only | compact and simple | hours of delay |

**Choice:** the real-time tier refreshes its searchable view about every second. Like and repost events
are aggregated in batches into a signals store, and the broker fetches signals only for the top ~1000
candidates.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** `WHERE text LIKE '%q%'` on the posts database. It is a full scan of hundreds of billions
of rows, with no ranking.
```diagram
v1
```
**v2, compose P1:** an inverted index fed by the post stream. Posting never waits and posts are
searchable in seconds, but one cluster can't hold five years or take event spikes.
```diagram
v2
```
**v3, compose P2 and P3:** time-tiered, document-partitioned shards, with a daily segment builder and a
scatter-gather broker with timeouts, hedging and a hot-query cache.
```diagram
v3
```
**v4, compose P4:** engagement flows through a stream into a signals store, and the broker re-ranks
with it.
```diagram
v4
```

## 6. Deep dives
- **Deletes in immutable segments.** A delete event sets a bit in the deleted-docs bitset of
  whichever tier holds the post, and queries filter those bits. The next segment merge purges the doc.
  F4's one minute is met without rewriting files. Visibility changes work the same way.
- **Tail latency.** With hundreds of shards, some shard is always slow. Send a hedged request to
  another replica after the p95 latency, and return partial results at the deadline. N1 matters more
  than the last few hits.
- **Hot queries during events.** Spikes are many people typing the same few queries. A short-TTL
  cache keyed by the normalised query and mode, with coalescing, collapses them to one fan-out per TTL.
- **Rebuilds.** The index is derived, so any shard or a whole tier can be rebuilt from the posts store
  or by replaying the stream. Do this when the tokenizer or ranking features change.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Elasticsearch](#/topic/system-design/elasticsearch) | inverted-index shards and replicas per tier | OpenSearch, Solr, a custom Lucene service |
| [Kafka](#/topic/system-design/kafka) | post-event and engagement streams | Pulsar, Kinesis |
| [Cassandra](#/topic/system-design/cassandra) | posts source of truth | DynamoDB |
| [Redis](#/topic/system-design/redis) | engagement signals, hot-query result cache | Memcached |

## 8. Patterns
- [CQRS](#/topic/system-design/cqrs): the index is a read model built from the write side's events.
- [Outbox](#/topic/system-design/outbox-pattern): posts and their index events can't diverge.
- [Scatter-gather](#/topic/system-design/scatter-gather): broker → shards → merge.
- [Hot keys](#/topic/system-design/hot-keys): the same query from millions during an event.
- The transferable shape is **derived, partitioned read model + scatter-gather + tiers by time**.
  Log search, metrics stores and e-commerce search are built the same way.

## 9. Evaluation
- **Bottlenecks:** the real-time tier takes both the write burst and most queries during events
  (more replicas, separate indexing from serving). Other pressure points are hot queries (cache), the
  slowest shard (hedging) and indexer lag (more consumers).
- **Failures:** replicas cover node loss, and a lost shard rebuilds from segments or the stream. If
  indexers are down, the stream buffers and posts become searchable late. If signals are down, rank on
  text and recency only.
- **Monitoring:** p50/p99 per tier, post → searchable lag, shard timeout and partial-result rates,
  cache hit ratio, tombstone backlog.
- **The 30-second answer:** posts emit events through an outbox to Kafka, and indexers write an
  in-memory real-time tier, searchable within seconds. Older posts live in document-partitioned,
  replicated time tiers built daily. A broker scatter-gathers per-shard top-k with hedging, re-ranks
  with engagement signals aggregated from a stream, and caches hot queries for seconds. Deletes are
  tombstones.

## 10. Tips and common mistakes
- Don't write to the index inside the post request. The index is a derived view, so feed it from a
  log.
- Term partitioning sounds efficient, but hot terms and multi-word queries make it painful. Say why
  you chose document partitioning.
- Don't reindex on every like; keep fast-changing signals out of the index.
- Name the tail-latency problem: with N shards, p99 is set by the worst one.

## 11. Learn more
- [Sharding](#/learn/system-design/sharding), [message queues](#/learn/system-design/message-queues)
  and [caching](#/learn/system-design/caching)
- [Search indexing](#/topic/system-design/search-indexing) and
  [stream processing](#/topic/system-design/stream-processing)
- Related case studies: [search autocomplete](#/design/system-design/typeahead) and
  [news feed](#/design/system-design/news-feed)
