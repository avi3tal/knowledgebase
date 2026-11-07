# Solution: YouTube (video streaming)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Three numbers shape everything: **~80 Tbps of egress**, **~2 PB of new storage a day** and **~300k
cores of encoding**. The core design keeps our own servers out of the byte path:
- uploads land in object storage;
- a pipeline of small, retryable tasks turns them into **adaptive-bitrate segments**;
- a **CDN** serves those segments next to the viewer.

Metadata, search and view counts are ordinary read-heavy services next to that.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Resumable upload of long, large videos |
| F2 | Transcode into a ladder of resolutions and formats, then publish |
| F3 | Stream on any device and network, quality adapting to bandwidth |
| F4 | Watch page: title, channel, thumbnails, view count |
| F5 | Search by title, tags, channel |
| F6 | Approximate, near-real-time view counts |
| N1 | Start in < 2 s, rare rebuffering, worldwide |
| N2 | Viewing 99.99% available; minutes to publish and seconds of search lag are fine |
| N3 | Uploaded originals are never lost |
| N4 | Cost-efficient egress and storage |

**Assumptions:** 800M DAU × 5 views; ~10 min per view at ~3 Mbps; 500 h uploaded per minute;
~3 GB per video-hour stored. **Out of scope:** recommendations, comments, live, ads, copyright
matching.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| views | 800M × 5 / day | **46k /s** (peak ~90k) |
| concurrent streams | 4B × 600 s / day | **~28M** |
| egress | 28M × 3 Mbps | **~83,000 Gbps (≈ 80 Tbps)** |
| uploads | 500 h × 60 × 24 | **720k hours/day** |
| new storage | 720k h × 3 GB | **~2,200 TB/day**, ~0.8 EB/year |
| encoding | 720k h × ~10 core-h / 24 h | **~300k cores** busy |

No origin can push 80 Tbps, so the CDN is mandatory, not an optimisation. 300k cores means encoding
must run as small retryable tasks on cheap, preemptible capacity. 46k views/s for metadata is
modest, but it is skewed toward viral videos.

## 3. API and data model
- `POST /uploads {title, size}` → `{upload_id, upload_url}`. Then `PUT /uploads/{id}` with
  `Content-Range`; a client resumes from the last byte the server confirms.
- `GET /videos/{id}` → `{title, channel, views, manifest_url, thumbnails}`, served from the cache.
- The player then fetches `<cdn>/{id}/master.m3u8` and the segment files from the CDN.
- `GET /search?q=` searches the index.
- `POST /videos/{id}/view` is a fire-and-forget heartbeat.

Entities:
- **`videos(video_id, channel_id, title, tags, status, renditions[], manifest_url)`** in SQL
  sharded by `video_id`.
- **Media objects**: originals, segments, manifests and thumbnails in object storage.
- **`view_counts(video_id, count)`** in a wide-column store.
- **Search documents** in Elasticsearch.

## 4. Decompose: the parts
### Part P1: Upload and transcoding pipeline (F1, F2, N3)
| option | pros | cons |
|---|---|---|
| transcode inside the upload request | simple | hours-long requests; a crash loses everything |
| one job per video on one worker | simple queue | long videos take hours; a crash restarts the whole job |
| **segment-level DAG: split → encode (segment × rendition) → package → publish** | minutes regardless of length; retry 10 s, not 3 h | an orchestrator; exact segment boundaries |

**Choice:**
1. The original lands in object storage through a resumable upload. Durability comes first (N3).
2. A DAG orchestrator splits the video at keyframes (GOP-aligned segments).
3. It enqueues one task per segment × rendition. Stateless ffmpeg workers pull the tasks and write
   output keyed by `(video, rendition, segment)`, so retries are idempotent.
4. A final step writes the HLS/DASH manifests and thumbnails, then marks the video `ready`.

```diagram
part:P1
```

### Part P2: Storage and CDN delivery with adaptive bitrate (F3, N1, N4)
| option | pros | cons |
|---|---|---|
| progressive MP4 from our origin | simple | 80 Tbps from a few data centres is impossible |
| one bitrate through a CDN | edge caching | stalls on weak networks, blurry on TVs |
| **HLS/DASH segments in a ladder, CDN edges + origin shield** | fast start, adapts per segment, cache-friendly | more renditions to store |

**Choice:** 2–6 s segments from 240p to 4K. The player starts low for a fast first frame, then
picks each next segment's rendition from its measured throughput and buffer level. The CDN serves
~95%+ of bytes. An origin shield collapses misses so object storage sees only a trickle.

```diagram
part:P2
```

### Part P3: Video metadata and search (F4, F5, N2)
| option | pros | cons |
|---|---|---|
| one SQL DB, `LIKE` search | simple | one primary; no ranking or tokenizing |
| **sharded SQL + read-through cache; search index fed by change events** | cache takes the skew; real relevance | seconds of index lag; two systems |
| one NoSQL store with secondary indexes | one system | weak text search |

**Choice:** `videos` is sharded by `video_id` with Redis in front, since watch pages for popular
videos are nearly all cache hits. Metadata changes go to Kafka, and an indexer updates
Elasticsearch.

```diagram
part:P3
```

### Part P4: Counting views (F6)
| option | pros | cons |
|---|---|---|
| `UPDATE … views = views + 1` | exact | a write per view; viral rows become hot locks |
| Redis `INCR` | fast | hot keys; no dedup or bot filtering |
| **events → windowed aggregation → batched increments** | cheap, spike-proof, filterable | counts lag seconds to minutes |

**Choice:** view heartbeats go to Kafka, partitioned by `video_id`. Each aggregation worker owns its
videos' counters in memory, dedupes `(viewer, video, window)`, drops bots, and flushes increments
every few seconds.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** one server uploads, encodes inline, stores files on local disk and streams them.
Nothing in this scales.
```diagram
v1
```
**v2, compose P1:** resumable uploads into object storage, and a DAG orchestrator fanning tasks out
to transcode workers. Viewers still stream through our API from the origin.
```diagram
v2
```
**v3, compose P2:** players pull manifests and segments from CDN edges, and the API leaves the
byte path. Metadata is still one hot DB and views are a write per view.
```diagram
v3
```
**v4, compose P3 and P4:** a cache over sharded metadata, an event-fed search index, and view
counts aggregated from a stream.
```diagram
v4
```

## 6. Deep dives
- **Bitrate ladder and codecs.** H.264 plays everywhere but produces the biggest files. Use a
  per-title ladder: simple cartoons need fewer bits than sports. Re-encode to VP9/AV1 only once a
  video crosses a popularity threshold. Egress costs far more than compute, and a few percent of
  videos get most views.
- **Popular vs long tail.**
  - Pre-warm CDN edges before expected hits such as big launches.
  - Let the origin shield absorb the long tail.
  - Move renditions that have gone 90 days without views to infrequent-access storage, and drop
    rarely used high renditions, re-encoding them on demand.
- **Pipeline failure.** Task output is keyed deterministically, so a retried task overwrites the
  same object. The orchestrator persists DAG state, so a restart resumes instead of starting over.
  Poison inputs go to a dead-letter queue after N retries.
- **Upload resumption.** The server records the committed byte offset per upload session. After a
  drop, the client asks for the offset and continues from there. Sessions expire after a week.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Object storage](#/topic/system-design/object-storage) | originals, segments, manifests (CDN origin) | HDFS |
| [Kafka](#/topic/system-design/kafka) | view and metadata-change events | Kinesis, Pub/Sub |
| [Flink](#/topic/system-design/flink) | windowed, deduplicated view aggregation | Spark Streaming |
| [Redis](#/topic/system-design/redis) | read-through cache for watch-page metadata | Memcached |
| [PostgreSQL](#/topic/system-design/postgresql) | `videos`, sharded by video_id | MySQL + Vitess |
| [Elasticsearch](#/topic/system-design/elasticsearch) | search over titles, tags, channels | OpenSearch, Solr |

## 8. Patterns
- [Fan-out](#/topic/system-design/fan-out): one upload becomes thousands of segment × rendition
  tasks.
- [Retries and DLQs](#/topic/system-design/retries-dlq): idempotent task outputs, with poison
  videos parked.
- [Pre-aggregation](#/topic/system-design/pre-aggregation): view events become batched counts.
- [Hot keys](#/topic/system-design/hot-keys): viral videos in the cache, the CDN and the counters.
- [CQRS](#/topic/system-design/cqrs): writes go to SQL, reads and search go to a cache and an index
  fed by events.
- The transferable shape is the **media pipeline + CDN**: durable ingest, asynchronous processing
  as a DAG of small tasks, and immutable cacheable outputs served from the edge. Podcast hosts,
  image services and game-patch distribution reuse it.

## 9. Evaluation
- **Bottlenecks:** CDN egress and hit ratio, transcode capacity during upload spikes, hot metadata
  for viral videos, the orchestrator's state store.
- **Failures:**
  - a worker crash means a task retry;
  - an orchestrator restart resumes the DAG;
  - when a CDN PoP is down, anycast/DNS steers viewers to the next one;
  - when a metadata shard is down, cached pages keep serving;
  - when the event stream is down, counts lag and playback is unaffected.
- **Monitoring:** start time and rebuffer ratio from player telemetry, CDN hit ratio and egress per
  PoP, upload success, upload-to-publish latency, task queue depth and retries, index lag, count
  lag.
- **The 30-second answer:** resumable uploads land in object storage. A DAG orchestrator splits each
  video into segments and fans encode tasks out over a queue to stateless workers, which write
  HLS/DASH renditions. Players stream adaptive-bitrate segments from a CDN with an origin shield.
  Metadata is SQL sharded by video_id behind Redis, search is Elasticsearch fed by events, and views
  are Kafka events aggregated in windows into batched counts.

## 10. Tips and common mistakes
- Say "CDN" with the number: 80 Tbps is why, not "because it's faster".
- Don't stream bytes through your API servers, and don't transcode inside the upload request.
- Adaptive bitrate needs segments *and* a ladder; name both.
- One job per video makes publish time scale with video length; segment the work.
- Counting views with a DB increment is the classic hot-row trap.

## 11. Learn more
- [Video streaming case study](#/topic/system-design/video-streaming) and [CDN](#/topic/system-design/cdn)
- [Blob storage](#/topic/system-design/blob-storage) and [message queues](#/learn/system-design/message-queues)
- [Caching](#/learn/system-design/caching) and [search indexing](#/topic/system-design/search-indexing)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
