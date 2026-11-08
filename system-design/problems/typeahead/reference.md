# Solution: search autocomplete (typeahead)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Every **keystroke** is a request, so the read path must be a single precomputed lookup and not a
search. Ranking is slow work (counting a billion searches a day), and it can lag by an hour, but
**trending** cannot. The design separates three paths:
- a dumb, fast, edge-cacheable read path;
- an offline pipeline that computes the answers;
- a small real-time overlay for what's new.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Suggest up to 10 completions for the current prefix as the user types |
| F2 | Rank by recent popularity (frequency with time decay) |
| F3 | Trending queries appear within ~10 minutes |
| F4 | Offensive or blocked queries are never suggested |
| N1 | < 100 ms end to end; origin p99 < 10 ms |
| N2 | Highly available, read-heavy (~120k requests/s peak); stale is fine, missing is not |
| N3 | Logging searches never slows search |

**Assumptions:** 1B searches/day, about 5 suggestion requests per search, about 100M distinct queries
of about 20 characters, English only. **Out of scope:** the results page, spelling correction, and
personalisation.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| suggestion requests | 1B × 5 ÷ 86,400 | **58k /s** (peak ~120k) |
| prefixes | 100M × 20 chars ÷ 4 (shared) | **500M** |
| prefix index | 500M × ~200 B | **100 GB** |
| query log | 1B × ~100 B | **100 GB/day** |

100 GB is too much for one box's RAM but small for a few Redis shards. 120k lookups/s is easy if each
lookup is a single GET. The short prefixes are the hottest and the most shared between users, so the
edge can carry a big share of the traffic.

## 3. API and data model
- `GET /suggest?q={prefix}&limit=10` → `{suggestions[]}` with `Cache-Control: max-age=600`. Using
  GET lets the browser and CDN cache it.
- `GET /search?q=` belongs to the search service. It emits a query-log event asynchronously.
- `prefix_index`: `v{version}:{prefix}` → top 10 `[query, score]`, in Redis, sharded by prefix hash.
- `query_log(query, ts)` lives in Kafka and is archived in hourly files.
  `query_counts(query, day, count)` holds daily aggregates.
- `trending_overlay`: prefix → hot queries, with a 2 h TTL.

## 4. Decompose: the parts
Four sub-problems: how to look up, where rankings come from, how to serve fast, and how to stay fresh.

### Part P1: Suggestion index, prefix → top 10 (F1, N1)
| option | pros | cons |
|---|---|---|
| SQL `LIKE 'prefix%' ORDER BY count` | no new system | a 1-letter prefix sorts millions of rows |
| search engine completion query | typo tolerance, flexible | work per keystroke; another cluster |
| in-memory trie, top 10 cached per node | walk len(prefix) nodes, answer ready | custom sharded service; memory-hungry |
| **precomputed prefix → top 10 table in Redis** | one GET; edge-cacheable | stores every prefix (~100 GB); rebuilt offline |

**Choice:** build a trie offline, flatten it into a prefix → top 10 table, and serve that from sharded
Redis. The trie is a build-time tool; at serving time it is just a key-value lookup.

```diagram
part:P1
```

### Part P2: Offline aggregation pipeline from query logs (F2, N3)
| option | pros | cons |
|---|---|---|
| update counts and index on every search | always current | hot writes and ranking work on the search path |
| **log to a stream, batch-aggregate, rebuild, swap** | search only appends; clean rebuilds | the index lags by up to an hour |

**Choice:** the search service appends to a Kafka query log, which is archived into hourly files.
Every hour a batch job:
1. folds the new hour into daily counts;
2. scores each query as Σ count × decay(age) over 30 days;
3. drops blocked queries;
4. builds the top 10 per prefix into version v+1;
5. flips the version pointer.

```diagram
part:P2
```

### Part P3: Serving latency at the edge (N1, N2)
| option | pros | cons |
|---|---|---|
| every keystroke to the origin | simple | the cross-ocean round trip alone can break 100 ms |
| client debounce + browser cache | fewer requests | doesn't help first lookups |
| **+ CDN caching short prefixes** | the hottest keys are served near the user | staleness up to the TTL; no personalisation |

**Choice:** a 50 ms debounce and browser caching on the client, a CDN that caches 1–3 character
prefixes for 10 minutes, and stateless suggest instances behind a load balancer for the long tail.

```diagram
part:P3
```

### Part P4: Freshness for trending queries (F3)
| option | pros | cons |
|---|---|---|
| rebuild the index every few minutes | one mechanism | expensive, and it still lags |
| **stream job + small trending overlay merged at read time** | minutes of lag, tiny state | two sources to merge; thresholds against noise and abuse |

**Choice:** Flink reads the same query log, counts queries in 5-minute sliding windows, and flags any
query far above its usual rate. Flagged queries are written to a small overlay that the suggest
service merges into the top 10.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** a single service runs `LIKE 'prefix%'` against one SQL table and increments counts on
every search. It is slow, it has a single point of failure, and the table is hot.
```diagram
v1
```
**v2, compose P1 and P2:** a precomputed prefix index in Redis, a Kafka query log, and an hourly
builder that publishes versions.
```diagram
v2
```
**v3, compose P3:** client debounce, browser cache and a CDN for short prefixes absorb most keystrokes
before they reach the origin.
```diagram
v3
```
**v4, compose P4:** a Flink trending detector writes an overlay that the suggest service merges.
```diagram
v4
```

## 6. Deep dives
- **Filtering.** Filter at build time with a blocklist and a classifier, which costs nothing per
  request. Also keep a tiny emergency blocklist that is checked at read time, so a bad suggestion can
  be removed in seconds rather than at the next build.
- **Index swap.** Write v+1 under new keys and flip a `current_version` pointer atomically. Keep v
  for instant rollback. Users never see a half-built index, and a failed build changes nothing.
- **Hot prefixes.** "a", "th" and "how" would each sit on one Redis shard. The CDN plus an in-process
  LRU in every suggest instance (a few thousand keys, a few MB) take them off Redis entirely.
- **Memory.** Cap prefixes at about 20 characters and drop queries seen fewer than N times in 30 days.
  Long prefixes are rare, and they are cheap to answer from the trie's leaf data if needed.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Redis](#/topic/system-design/redis) | prefix index and trending overlay | an in-house trie service, Memcached |
| [Kafka](#/topic/system-design/kafka) | the query log, read by both batch and stream | Kinesis |
| [Flink](#/topic/system-design/flink) | 5-minute windowed counts for trending | Spark Structured Streaming |
| [Object storage](#/topic/system-design/object-storage) | hourly archive of raw query logs | HDFS |
| [Cassandra](#/topic/system-design/cassandra) | `query_counts` per day | any wide-column or KV store |

## 8. Patterns
- [Pre-aggregation](#/topic/system-design/pre-aggregation): the answer for each prefix is computed
  before anyone asks for it.
- [CQRS](#/topic/system-design/cqrs): the write side (query log) and the read model (prefix index)
  are separate systems, joined by a build job.
- [Hot keys](#/topic/system-design/hot-keys): short prefixes are served from the edge and from local
  memory.
- The transferable shape is: **precompute per key offline, serve with one lookup, patch freshness
  with a small real-time overlay.** Leaderboards, "people also bought" and feed ranking have the same
  shape.

## 9. Evaluation
- **Bottlenecks:** hot short prefixes (edge cache and local LRU), the build job's runtime (keep daily
  aggregates), and index memory (prune rare queries, cap the prefix length).
- **Failures:** if a Redis shard fails, its replica takes over and the CDN keeps serving short
  prefixes. A failed build leaves the current version serving. If Kafka or Flink is down, search still
  works, the index ages and trending pauses.
- **Monitoring:** p99 latency at the edge and the origin, CDN hit ratio, index version age, build
  failures, overlay size, and suggestion click-through rate.
- **The 30-second answer:** precompute a prefix → top 10 table from a trie, offline, every hour, from
  Kafka query logs with time-decayed counts, and swap it in by version. Serve it with one GET from
  sharded Redis behind a load balancer, with debounce, browser cache and a CDN in front for short
  prefixes. Trending comes from a Flink job that writes a small overlay, which the service merges at
  read time.

## 10. Tips and common mistakes
- Don't describe a trie and then do the top-k search at request time. Store the top 10 at each node,
  or skip the trie at serving time entirely.
- Count requests, not searches: one search is about 5 keystroke requests.
- Don't update counts inside the search request. Log, then aggregate.
- Trending and general popularity have different freshness needs, so don't rebuild everything every
  minute.
- Make `/suggest` a cacheable GET. The edge is the cheapest server you have.

## 11. Learn more
- [Caching](#/learn/system-design/caching) and [CDNs](#/topic/system-design/cdn)
- [Stream processing](#/topic/system-design/stream-processing) and
  [search indexing](#/topic/system-design/search-indexing)
- [Consistent hashing](#/learn/system-design/consistent-hashing) (sharding the prefix index)
