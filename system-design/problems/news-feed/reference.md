# Solution: news feed

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The feed is read about **20 times for every post written**, yet each read needs posts from
hundreds of authors. The whole design is a decision about *when* to pay for that merge:
- at write time (copy the post into every follower's feed),
- at read time (gather from every followee),
- or both, with a switch for the few accounts whose audiences make write time explode.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Publish a post: text plus optional photos/videos |
| F2 | Home feed: recent posts from followed accounts, newest first, 20 per page, infinite scroll |
| F3 | Follow / unfollow |
| N1 | Feed page p99 < 300 ms; ~20 loads per post |
| N2 | Eventually consistent: a post reaches followers within ~10 s |
| N3 | Publishing never waits on distribution, and a stored post is never lost |
| N4 | Media served fast worldwide, never through the app servers |

**Assumptions:** 200M DAU, 10 feed opens and 0.5 posts per user per day, peak 2×; 300 followers on
average, a few thousand accounts with tens of millions; 30% of posts carry ~1 MB of media.
**Out of scope:** ML ranking, ads, comments and likes, search.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| feed loads | 200M × 10 / day × 2 peak | **46k /s** peak |
| posts | 200M × 0.5 / day | **1.2k /s** (peak ~2.4k) |
| fan-out inserts | 1.2k /s × 300 followers | **350k /s** |
| feed cache | 200M users × 500 ids × 8 B | **800 GB** |
| new media | 100M posts × 30% × 1 MB | **30 TB / day** |
| one celebrity post | 40M followers | **40M inserts** |

What the numbers say: 350k inserts/s is large but spreads across shards. 800 GB of RAM is a cluster,
and a reason to skip inactive users. The 40M-insert post is the outlier the design must route around.
30 TB/day of media should never touch the post service.

## 3. API and data model
- `POST /media {content_type, size}` → `201 {media_id, upload_url}`: a presigned PUT URL.
- `POST /posts {text, media_ids[]}` → `201 {post_id, created_at}`, with an `Idempotency-Key`.
  It returns once the post is stored.
- `GET /feed?cursor=&limit=20` → `{posts[], next_cursor}`. The cursor is the last time-sortable
  post_id; offsets would shift as new posts arrive.
- `POST /users/{id}/follow` (and `DELETE` to unfollow).
- `posts(post_id PK, author_id, text, media_urls, created_at)` lives in a wide-column store keyed by
  post_id.
- `follows(follower_id, followee_id, created_at)` is indexed both ways: *followers of X* for fan-out
  and *who X follows* for the celebrity merge.
- `feeds`: user_id → the latest ~500 post_ids, in a cache.
- Media bytes live in object storage; the post only keeps URLs.

## 4. Decompose: the parts
Four sub-problems, each solved on its own and then merged by node id.

### Part P1: Post write and storage (F1, N3)
Accept ~2.4k posts/s at peak, give each a time-sortable id, and hand it to distribution without a
window where it can be lost.

| option | pros | cons |
|---|---|---|
| single SQL table, auto-increment ids | simple, transactional | one primary takes every write; ids clash once sharded |
| **wide-column store keyed by a Snowflake-style id, plus an outbox entry** | horizontal writes; ids sort by time; the hand-off survives crashes | no cross-row transactions; each node needs an id generator |
| write the post, then publish to the queue in the request | fewest moving parts | a crash between the two writes loses the fan-out (dual write) |

**Choice:** the post and an outbox entry are written together. A relay moves outbox entries onto the
fan-out queue. Time-sortable ids double as feed cursors.

```diagram
part:P1
```

### Part P2: Fan-out: delivering posts to followers (F2, N1, N2)
| option | pros | cons |
|---|---|---|
| fan-out on read (pull) | no write amplification; always fresh | each load queries ~300 authors and merges: too slow at 46k/s |
| fan-out on write (push) | a load is one cache read | 350k inserts/s; a 40M-follower post backs up the queue |
| **hybrid: push for normal accounts, pull for huge ones** | cheap reads, bounded write cost | two code paths and a merge at read time |

**Choice:** workers consume the queue, look up the author's followers and push the post_id onto each
follower's list (trimmed to 500). Accounts above ~100k followers are skipped. Reads outnumber writes
20:1, so the push is worth paying for. Skipping the outliers keeps the queue inside the 10 s budget.

```diagram
part:P2
```

### Part P3: Feed read and ranking (F2, N1)
| option | pros | cons |
|---|---|---|
| hydrate every id from the posts store | always consistent | ~20 store reads per page, ~1M/s at peak; hot posts hammer a partition |
| **post cache, one batch get, merge celebrity posts, then order** | one cache round trip for bodies; hot posts stay in memory | invalidation on edits and deletes |
| inline ML ranking on every load | better engagement | latency and a new dependency; not needed for v1 |

**Choice:** read ids from the feed cache, look up which celebrities the user follows, and merge their
recent posts from the post cache. Batch-hydrate the 20 bodies and order by time through a *scorer hook*.
A ranking model can replace that hook later without touching storage.

```diagram
part:P3
```

### Part P4: Media upload and delivery (F1, N4)
| option | pros | cons |
|---|---|---|
| upload through the post service into the database | one request | app servers stream gigabytes; the database bloats |
| **presigned upload to object storage, workers make renditions, a CDN serves them** | services only sign URLs | two-step publish; orphaned uploads need a cleanup job |

**Choice:** the app asks for an upload URL, PUTs the bytes through the CDN edge to object storage, then
creates the post with `media_ids`. A worker reacts to "object created" and writes resized renditions.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** one service and one SQL database. Each load joins follows with posts and sorts. At
46k loads/s × 300 authors the database is the bottleneck.
```diagram
v1
```
**v2, compose P1 and P2:** a load balancer over separate post and feed services. Posts go to the
wide-column store and the fan-out queue, and workers fill per-user feed lists. Still wrong: bodies come
from the store, and celebrity posts flood the queue.
```diagram
v2
```
**v3, compose P3:** the hybrid switch and the post cache. Workers skip huge accounts, and the feed
service merges their posts and hydrates from memory.
```diagram
v3
```
**v4, compose P4:** media leaves the request path: presigned uploads, renditions and a CDN.
```diagram
v4
```

## 6. Deep dives
- **Celebrity threshold.** A fixed ~100k-follower line is easy to reason about. A dynamic rule
  (followers × share active) is more precise but harder to test. When an account crosses the line,
  flip a flag; entries already pushed simply age out of feeds.
- **Pagination.** Use a cursor on the time-sortable post_id. New posts land above the cursor, so
  there are no duplicates or gaps.
- **Inactive users.** Only precompute for users active in the last 30 days. A returning user's
  first load pulls once and refills the list. This cuts both cache memory and insert rate.
- **Deletes and edits.** Delete the post and its post-cache entry. Feed lists may still hold the id;
  hydration drops ids it can't find, so no fan-out of deletes is needed.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Redis](#/topic/system-design/redis) | feed lists (user → post_ids) and the post cache | Memcached, an in-house list store |
| [Kafka](#/topic/system-design/kafka) | fan-out queue, partitioned by author | SQS, Pulsar |
| [Cassandra](#/topic/system-design/cassandra) | posts by post_id, write-heavy and horizontal | DynamoDB |
| [Object storage](#/topic/system-design/object-storage) | photos, videos and their renditions | a distributed file system |

## 8. Patterns
- [Fan-out](#/topic/system-design/fan-out): push on write for most authors, pull on read for the few.
- [Hot keys](#/topic/system-design/hot-keys): celebrity accounts and viral posts.
- [Outbox](#/topic/system-design/outbox-pattern): store the post and the distribution job atomically.
- [Presigned URLs](#/topic/system-design/presigned-urls): bytes go straight to storage.
- The transferable shape is **precompute for the many, compute on demand for the few**. Inboxes,
  activity streams, notification centres and leaderboards all have it.

## 9. Evaluation
- **Bottlenecks:** fan-out backlog on big news days (more workers, prioritise active users). Hot post
  bodies (replicate the post cache). Feed cache memory (ids only, trim, skip inactive users).
- **Failures:** if a feed-cache shard is lost, rebuild those feeds by pulling. If the workers are down,
  posts are safe and the outbox and queue hold the work; feeds catch up late. For a CDN miss storm,
  put an origin shield in front of object storage.
- **Monitoring:** feed p99, cache hit ratios, publish → visible lag (queue lag), worker errors, CDN hit
  ratio, orphaned uploads.
- **The 30-second answer:** posts go to a wide-column store with an outbox. Workers fan out post ids
  into per-user Redis lists, except for accounts over ~100k followers, which are merged at read time.
  The feed service reads ids, merges and batch-hydrates from a post cache, and pages with a
  time-sortable cursor. Media goes direct to object storage with presigned URLs and is served by a CDN.

## 10. Tips and common mistakes
- Don't pick push or pull before saying the 20:1 ratio and the 40M-follower outlier out loud.
- Store ids in the feed cache, not post bodies: an edit would otherwise touch millions of copies.
- Offset pagination on a live feed shows duplicates; use a cursor.
- Don't let the author wait on fan-out, and don't dual-write post and queue without an outbox.

## 11. Learn more
- [Caching](#/learn/system-design/caching) and [message queues](#/learn/system-design/message-queues)
- [Sharding](#/learn/system-design/sharding) for the feed cache and posts store
- [CDN](#/topic/system-design/cdn) and [blob storage](#/topic/system-design/blob-storage)
- Related case studies: [photo sharing](#/topic/system-design/photo-sharing) and
  [notification system](#/topic/system-design/notification-system)
