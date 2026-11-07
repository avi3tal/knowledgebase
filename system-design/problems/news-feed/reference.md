# Reference walkthrough: news feed

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Scope
Two use cases: **publish a post** and **read the home feed** (followed accounts, newest first,
paginated). Following is the glue. Non-functional: the feed loads in **< 300 ms**, the system is
**read-heavy (~20 loads per post)**, and **eventual consistency within ~10 s** is fine, which is
what makes precomputation possible.

## 2. Estimates
200M DAU × 10 = **2B feed loads/day** ≈ 23k/s, **~46k/s peak**. Posts: 100M/day ≈ **1.2k/s**.
Copying each post into 300 feeds is **~350k inserts/s**: big but horizontal. Storing 500 ids
(8 B each) per user is ~4 KB × 200M ≈ **800 GB of feed cache**: a sharded cluster, and a reason to
skip inactive users. One 40M-follower post alone would be 40M inserts, which is the outlier to
design around.

## 3. API and data
`POST /posts` (media uploaded beforehand with a pre-signed URL), `GET /feed?cursor=&limit=20`
with a **cursor on a time-sortable post_id** (offsets break while the feed changes), and
follow/unfollow. Data: `posts` by id in NoSQL, `follows` indexed in both directions, and a
per-user **feed list of post ids** in a cache.

## 4. Evolving the design
- **v1:** one service and one SQL DB; each load joins follows with posts (**fan-out on read**).
  At 46k loads/s × 300 authors the database is the bottleneck.
- **v2:** **fan-out on write**. The post service stores the post and enqueues a job, and workers
  push the id into each follower's cached feed. A load is one cache read + a batch get. A
  celebrity post still floods the queue.
- **v3:** **hybrid**. No fan-out above ~100k followers; the feed service merges those accounts'
  recent posts from a hot post cache at read time. Media moves to **blob storage + CDN**.

## 5. Deep dives
- **Push vs pull.** Pull is always fresh but makes every read expensive. Push makes reads cheap
  and writes amplified. With 20:1 reads and a 10 s freshness budget, push is the default.
- **Celebrities.** A threshold splits authors. Followers follow few huge accounts, so merging their
  cached recent posts at read time costs little and protects the fan-out queue.
- **Pagination.** Cursor on post_id: no duplicates or gaps as new posts arrive.

## 6. Wrap-up
Bottlenecks: fan-out backlog (more workers, prioritise active users), hot post bodies (replicated
post cache), feed cache memory (ids only, trim, skip inactive users). A lost feed-cache shard is
rebuilt on demand by pulling. Watch publish→visible lag, feed p99, cache hit ratio and CDN hit
ratio. Ranking later reuses this cache as its candidate set.

## Transferable pattern
**Precompute for the many, compute on demand for the few:** when reads dominate, move work to
the write path (fan-out into per-user caches), and switch strategy for the outliers whose
write-time cost would explode. The same shape appears in inboxes, activity streams, leaderboards
and notification centres.
