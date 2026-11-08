## How to recognise you need it

**Strong signals:**
- Large, **write-once** binary data: photos, video, audio, documents, backups, logs, ML
  datasets, crawled pages.
- Sizes from KB to many GB, total volume in **TB to PB**, growing every day.
- The data is read **whole or by byte range**, never queried by its contents.
- "Must never be lost" plus "must be cheap" for data that is mostly cold.
- Uploads from clients on flaky networks (multipart, resumable, direct-to-storage).

**Anti-signals:**
- Small records that are updated in place or queried by field: that's a database
  ([SQL / NoSQL](#/topic/system-design/databases-sql-nosql)), not objects.
- Millisecond reads of tiny hot values: use a [cache](#/learn/system-design/caching) or a KV
  store. First-byte latency of tens of ms is too slow.
- Appending to a file or editing it in place many times a second: objects are immutable.

**Look-alikes, and why they're different:**
- **[Blob storage](#/topic/system-design/blob-storage)** is the general idea: keep big binary
  data outside the database. Object storage (S3, GCS, Azure Blob) is the concrete managed service
  you name in a design, with its own limits and API.
- **[CDN](#/topic/system-design/cdn)** **delivers** popular objects from the edge. It caches;
  it is not the durable copy. Object storage is the origin behind it.
- **[Presigned URLs](#/topic/system-design/presigned-urls)** are a way to **authorise** direct
  access to one object. They don't store anything.
- **[Chunking and dedup](#/topic/system-design/chunking-dedup)** decides **how a file is split**
  and when parts are equal. Object storage just holds the resulting parts.

> [!DIALOGUE] Scoping storage for user uploads
> **Candidate:** What are we storing, and how big? Photos, or also long videos?
> **Interviewer:** Both. Photos around 2 MB, videos up to 10 GB.
> **Candidate:** How are they read: whole files, or streamed with seeking?
> **Interviewer:** Videos are streamed, and a few files go viral.
> **Candidate:** Then object storage for the bytes, multipart presigned uploads, ranged GETs for seeking, and a CDN in front for the viral ones.

> [!PITFALL] Interview pitfalls
> - Streaming uploads through the API servers instead of using direct, presigned uploads.
> - Storing media in database rows, or forgetting the metadata table that maps ids to keys.
> - No CDN in front of popular media, so every view pays storage egress and latency.
> - Treating it like a filesystem: renaming a "folder" means copying every object under it.
> - Deleting shared (deduplicated) parts while a manifest still uses them.

**In our problems:**
- **instagram**: where the original photo and its resized copies live, uploaded directly.
- **news-feed**: holds post photos and videos so the feed service only stores keys.
- **web-crawler**: the durable archive of raw fetched pages that the indexing team re-reads.
- **dropbox**: holds the file contents themselves, kept apart from the file tree and its history.
- **youtube**: the origin for raw uploads and every transcoded rendition behind the CDN.
