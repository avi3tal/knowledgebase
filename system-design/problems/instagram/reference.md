# Solution: Instagram (photo sharing)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Two very different kinds of data share one product.
- **Heavy, immutable bytes:** ~250 TB of photos a day. They want object storage, background
  processing and a CDN.
- **Tiny, hot metadata:** follows, feed entries and like counts. They want caches, fan-out and
  counters that survive a celebrity.

The design works once the two are separated: bytes never touch the API servers, and metadata never
waits for bytes.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Upload a photo with a caption; followers see it once processed |
| F2 | Home feed of photos from followed accounts, 10 per page |
| F3 | Follow / unfollow; profiles show follower and following counts |
| F4 | Like / unlike; each photo shows its count and whether I liked it |
| N1 | Feed p99 < 500 ms; images served from a nearby edge; ~50 feed loads per upload |
| N2 | A processed photo reaches followers within ~5 s |
| N3 | An acknowledged upload is never lost (multi-zone, 11 nines) |
| N4 | Counts may lag seconds; my own like shows at once and counts once |

**Assumptions:** 500M DAU, 100M uploads/day, 10 feed opens and 8 likes per user per day, peak 2–2.5×.
Originals are ~2 MB and renditions add ~0.5 MB. Followers average ~150; a few accounts have hundreds of
millions. **Out of scope:** video and stories, comments, DMs, search, ads.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| uploads | 100M / day | **1.2k /s** (peak ~3k) |
| new bytes | 100M × 2.5 MB | **250 TB / day**, ~90 PB / year |
| feed loads | 500M × 10 / day × 2 | **116k /s** peak |
| likes | 500M × 8 / day | **46k /s** (peak ~100k) |
| fan-out inserts | 1.2k /s × 150 | **175k /s** |
| one celebrity post | 300M followers | **300M inserts** if pushed |

What the numbers say:
- 250 TB/day must flow edge → object storage without touching a service.
- Reads outnumber uploads ~50:1, so feeds are worth precomputing, except for the celebrity outlier.
- 46k likes/s is fine in aggregate. The danger is thousands per second on *one* photo.

## 3. API and data model
- `POST /uploads {content_type, size}` → `{media_id, upload_url}`: a presigned PUT, valid 15 min.
- `PUT <upload_url>`: the bytes go through the CDN edge to object storage.
- `POST /posts {media_id, caption}` → `201 {post_id, status: processing}`, with an `Idempotency-Key`.
- `GET /feed?cursor=&limit=10` → `{posts[{post_id, image_urls, caption, like_count, liked_by_me}], next_cursor}`.
- `POST /posts/{id}/like` is idempotent; `DELETE` unlikes. `POST /users/{id}/follow` follows.

Data and where it lives:
- `posts(post_id, author_id, caption, media_keys, status, created_at)`: wide-column store.
- `followers(user_id, follower_id)` and `following(user_id, followee_id)`: wide-column store, both
  partitioned by user.
- `likes(post_id, user_id)` with a composite PK: wide-column store.
- `like_counters(post_id[#shard] → count)`: Redis.
- Originals and renditions: object storage behind the CDN.

## 4. Decompose: the parts

### Part P1: Media upload pipeline (F1, N1, N3)
| option | pros | cons |
|---|---|---|
| upload through API servers, bytes in the database | one request | servers stream terabytes; the database and its backups explode |
| upload through API servers to object storage, resize inline | storage is right | requests hold connections for seconds; resize CPU on the request path |
| **presigned PUT to object storage; object-created event → resize queue → workers; CDN delivery** | servers only sign URLs; processing scales on its own; immutable files cache forever | two-step publish; orphaned uploads need a sweeper |

**Choice:** the post service signs an upload URL and creates the post as `processing`. Storage emits
"object created", and resize workers write 3–4 WebP/AVIF renditions and mark the post `ready`.
Durability comes from multi-zone object storage *before* the upload is acknowledged.

```diagram
part:P1
```

### Part P2: Follow graph (F3)
| option | pros | cons |
|---|---|---|
| one SQL `follows` table, two indexes | simple, consistent | ~75B rows; a celebrity's followers are a giant scan on one shard |
| **two adjacency lists in a wide-column store, partitioned by user** | each direction is one range scan; scales out | two writes per follow; a repair job for drift |
| graph database | multi-hop queries | we only need one hop; harder to shard and run |

**Choice:** `followers-of` and `following-of` are written together, and a background job repairs any
drift. Counts and a `celebrity` flag are cached. Fan-out pages through follower lists in chunks.

```diagram
part:P2
```

### Part P3: Feed generation (F2, N1, N2)
| option | pros | cons |
|---|---|---|
| pull: query every followee on open | no write amplification | ~150 lookups × 116k loads/s; slow tail |
| push: write post ids into every follower's feed | a load is one cache read | 175k inserts/s, and 300M for one celebrity post |
| **hybrid, ranked over candidates** | cheap reads, bounded writes, room for ranking | two code paths and a merge |

**Choice:** fan-out is triggered by a **post-ready** event, never by the upload, so nobody sees a photo
without renditions. Workers push post ids into followers' feed lists, skipping accounts above ~1M
followers. On open, the feed service:
1. reads the candidate list;
2. merges the recent posts of followed celebrities;
3. hydrates the metadata;
4. orders the result with a light ranker (recency, affinity, engagement).

```diagram
part:P3
```

### Part P4: Likes and counters (F4, N4)
| option | pros | cons |
|---|---|---|
| `UPDATE posts SET likes = likes + 1` | exact, simple | row-lock contention on viral posts |
| Redis `INCR` per like | fast | one hot key per viral post; drifts from the truth after failures |
| **idempotent likes rows + events + batched aggregation into sharded counters** | a viral post becomes a few writes per second; counts can be rebuilt | counts lag by seconds |

**Choice:** the like service inserts `(post_id, user_id)` if absent and emits a +1 only on success. An
aggregator sums events per post every second or so and applies `+n`. A hot post's counter is split
into N sub-keys and summed on read. "Liked by me" comes from the likes row, so it is exact at once.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** one service and one SQL database that stores photo bytes, joins the feed and increments
a likes column. It fails on bytes, reads and hot rows all at once.
```diagram
v1
```
**v2, compose P1:** bytes leave the request path. Presigned upload, resize queue and workers, a CDN,
and post metadata in a wide-column store. Feed and likes still use the old database.
```diagram
v2
```
**v3, compose P2 and P3:** a graph service over two adjacency lists, and hybrid fan-out from
post-ready events into per-user feed lists. The feed service merges celebrity posts and ranks.
```diagram
v3
```
**v4, compose P4:** likes become rows plus events, and an aggregator feeds sharded counters. The old
database is gone.
```diagram
v4
```

## 6. Deep dives
- **Counting a like once.** The `(post_id, user_id)` key makes double taps and retries no-ops, and
  only a successful insert emits an event. The stream is at-least-once, so the aggregator dedups by
  event id (or recomputes a post's count from the likes table when in doubt).
- **Renditions: eager or on demand.** Feed sizes are requested by followers within seconds, so make
  them eagerly. Rare sizes are made on the first CDN miss, which saves storage on 100M photos a day.
- **Orphans and stuck posts.** Uploads with no post after 24 h are deleted. Posts stuck in
  `processing` are re-queued, and resize is idempotent per media_id.
- **Storage cost.** Move originals older than a few months to an infrequent-access class. Renditions
  stay hot because the CDN keeps asking for them.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Object storage](#/topic/system-design/object-storage) | originals and renditions, multi-zone | a distributed file system (Haystack-style) |
| [Cassandra](#/topic/system-design/cassandra) | posts, both adjacency lists, likes | DynamoDB |
| [Redis](#/topic/system-design/redis) | feed lists, graph cache, like counters | Memcached (no atomic ops) |
| [Kafka](#/topic/system-design/kafka) | post-ready and like events | SQS, Pulsar |

## 8. Patterns
- [Presigned URLs](#/topic/system-design/presigned-urls): bytes skip the services.
- [Fan-out](#/topic/system-design/fan-out): hybrid push and pull for feeds.
- [Pre-aggregation](#/topic/system-design/pre-aggregation): like events become batched `+n`.
- [Hot keys](#/topic/system-design/hot-keys): viral photos and celebrity accounts.
- [Idempotency](#/topic/system-design/idempotency): likes, uploads and resize jobs.
- The transferable shape is **separate bytes from metadata**: blobs go through storage, async
  processing and a CDN; small records go through caches, fan-out and aggregated counters. Video
  platforms and file sharing have the same shape.

## 9. Evaluation
- **Bottlenecks:** hot like counters (sub-keys, batching), fan-out for huge accounts (pulled
  instead), resize backlog after spikes (autoscale on queue depth), CDN origin load (origin shield).
- **Failures:** uploads are durable before the ack, and resize jobs retry idempotently. Counters
  rebuild from likes, a lost feed-cache shard is rebuilt by pulling, and stuck posts are swept.
- **Monitoring:** upload success rate, upload → visible latency, resize queue depth, feed p99, CDN
  hit ratio, counter lag, orphaned uploads.
- **The 30-second answer:** presigned uploads go straight to object storage. Object-created events
  queue resize workers, renditions are served from a CDN, and metadata lives in a wide-column store.
  The follow graph is two adjacency lists. Hybrid fan-out is triggered when a post is ready and merges
  celebrities at read time. Likes are idempotent rows plus events, aggregated into sharded counters.

## 10. Tips and common mistakes
- Don't send photo bytes through your API or store them in a database.
- Fan out on "post ready", not on upload, or followers see broken images.
- A single like counter per post is the hot spot interviewers wait for; aggregate and shard it.
- Quote 250 TB/day out loud. It justifies object storage, CDN and storage tiers in one breath.

## 11. Learn more
- [Caching](#/learn/system-design/caching), [sharding](#/learn/system-design/sharding) and
  [message queues](#/learn/system-design/message-queues)
- [Blob storage](#/topic/system-design/blob-storage) and [CDN](#/topic/system-design/cdn)
- Related case studies: [news feed](#/topic/system-design/news-feed) and
  [video streaming](#/topic/system-design/video-streaming)
