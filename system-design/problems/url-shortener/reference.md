# Solution: URL shortener

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
It is the smallest end-to-end design. It has one entity, two calls and an extreme **100:1 read/write
ratio**. Everything interesting comes from that ratio:
- producing keys cheaply on write;
- serving reads from memory;
- keeping side effects (analytics) away from the read path.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Shorten: a long URL (optionally a custom alias) becomes a unique short URL |
| F2 | Redirect: opening a short URL redirects to the long one |
| F3 | Links expire after 5 years by default; owners can delete them |
| F4 | Count clicks per link (best effort) |
| N1 | Redirect p99 < 50 ms; ~100 reads per write |
| N2 | Redirects 99.99% available; brief write outages are tolerable |
| N3 | Codes are not guessable in sequence |

**Assumptions:** 100M new links/month, ~500 B per record, analytics may lag by minutes. **Out of
scope:** accounts and billing.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| writes | 100M / month | **40 /s** |
| reads | 40 /s × 100 | **4,000 /s** (peak ~10k) |
| storage, 5 years | 100M × 60 × 500 B | **3 TB** |
| code space | 62^7 | **3.5 × 10^12**, so 7 characters are plenty |

3 TB is too much for one machine's RAM but small for a sharded key-value store. Caching the hottest
20% of a day's reads needs well under 200 GB.

## 3. API and data model
- `POST /urls {long_url, alias?, expires_at?}` → `201 {code, short_url}`. Make it idempotent with an
  `Idempotency-Key` header.
- `GET /{code}` → `302 Location: long_url`, or `404`. This is the hot path.
- `links(code PK, long_url, owner_id, created_at, expires_at)` is only ever accessed by key, so it
  fits a key-value store sharded by `code`.
- `click_counts(code, day, count)` is written in batches by the analytics worker.

## 4. Decompose: the parts
Split the problem into three independent sub-problems, solve each, then merge them.

### Part P1: Short code generation (F1, N3)
| option | pros | cons |
|---|---|---|
| hash(long_url), truncated | stateless | collisions must be detected and retried |
| random 7 characters | unguessable | an existence check on every write |
| **counter leased in ranges + base62** | no collisions, cheap | needs a range allocator; sequential unless shuffled |

**Choice:** each instance leases a block of 1M ids from a coordinator (etcd/ZooKeeper). It encodes
them in base62 and applies a reversible bit shuffle so codes don't look sequential.

```diagram
part:P1
```

### Part P2: Redirect read path (F2, N1, N2)
| option | pros | cons |
|---|---|---|
| a single SQL database | simple | every redirect hits one box: slow and a single point of failure |
| SQL + read replicas | scales reads somewhat | lag, still a disk lookup per redirect |
| **read-through cache over a sharded KV store** | memory-speed hits, scales out | invalidation on delete/expiry, hot keys |

**Choice:** stateless instances behind a load balancer, with Redis in front of a key-value store
sharded by code. Access is key-only and read-heavy, so the cache carries most reads.

```diagram
part:P2
```

### Part P3: Click analytics off the hot path (F4)
| option | pros | cons |
|---|---|---|
| increment a counter inside the request | exact | a write on every redirect, plus hot counters |
| **emit events to a stream, aggregate in batches** | the redirect stays a pure read | counts lag by minutes |

```diagram
part:P3
```

## 5. Reduce: the high-level design
Merge the parts by node id, one problem at a time:

**v1, naive:** one service and one SQL database. It works for a demo, but the read-heavy requirement
breaks it.
```diagram
v1
```
**v2, compose P1 and P2:** a load balancer, a cache, a sharded store and the id allocator.
```diagram
v2
```
**v3, compose P3:** click events flow to a stream and a worker, never blocking a redirect.
```diagram
v3
```

## 6. Deep dives
- **301 vs 302.** A 301 is cached by browsers and CDNs, which means less load but invisible clicks. A
  302 keeps every click visible. Since F4 is in scope, choose 302 and let the cache absorb the load.
- **Hot links.** A viral code can overload one cache shard. Replicate hot keys, or keep a small
  in-process LRU in each instance.
- **Expiry.** Give cache entries a TTL no longer than the link's own. A daily job removes expired
  rows.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Redis](#/topic/system-design/redis) | read-through cache: code → long_url | Memcached |
| [DynamoDB / key-value](#/topic/system-design/dynamodb) | the `links` table, sharded by code | Cassandra |
| [Kafka](#/topic/system-design/kafka) | stream of click events | Kinesis, SQS |
| [etcd / ZooKeeper](#/topic/system-design/zookeeper-etcd) | leases id ranges to instances | a SQL sequence row |

## 8. Patterns
- [Idempotency keys](#/topic/system-design/idempotency): retries of `POST /urls` must not create
  duplicate links.
- [Hot keys](#/topic/system-design/hot-keys): viral links on one cache shard.
- [Pre-aggregation](#/topic/system-design/pre-aggregation): click events become daily counts.
- The transferable shape is a **read-heavy key → value lookup**. Pay once on write, serve reads from
  memory or the edge, and push side effects onto a queue. Pastebins, feature-flag services and
  DNS-like resolvers have the same shape.

## 9. Evaluation
- **Bottlenecks:** the id allocator (mitigated by leasing big ranges), hot cache shards, and store
  primaries (replicas, multi-AZ).
- **Failures:** if the cache is down, reads fall back to the store behind a rate limit. If the stream
  is down, clicks are dropped (best effort) and redirects continue.
- **Monitoring:** p50/p99 redirect latency, cache hit ratio, 404/5xx rates, stream lag, and SLO burn
  alerts.
- **The 30-second answer:** base62 codes from leased counter ranges; stateless services behind a load
  balancer; a Redis read-through cache over a key-value store sharded by code; 302 redirects; clicks
  go to Kafka and are aggregated in batches.

## 10. Tips and common mistakes
- Don't start from the database. Start from the 100:1 ratio and let it drive the design.
- Hashing the URL "because it's unique" is a trap: truncated hashes collide.
- Don't count clicks inside the redirect request.
- Say the numbers out loud: 40 writes/s doesn't need sharding for writes; 3 TB does need it for
  storage.

## 11. Learn more
- [Caching](#/learn/system-design/caching) and [consistent hashing](#/learn/system-design/consistent-hashing)
- [Unique ID generation](#/topic/system-design/unique-id-generation)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
