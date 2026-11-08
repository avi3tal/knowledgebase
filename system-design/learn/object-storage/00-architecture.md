## Architecture at a glance

Before buckets, durability and multipart, see the system an architect would draw. This is a
photo and video app: people upload from their phones, the platform makes thumbnails and
streaming renditions, and millions of viewers read the results. The object store is the centre,
and the API never touches a byte. Play the figure, then switch the tabs: a midnight upload spike,
a thumbnailer bug, and a new rendition size for billions of old photos.

```figure
system-overview
```

### Zoom in: the upload

A big upload is two short API calls with the real work in between, done by the client and the
store. Watch which side holds the bytes and what starts the processing. Then try the tabs: a
lost event, a retried completion, and a client that sends something other than it promised.

```figure
upload-session
```

### Zoom in: the read path

Reads are where the volume is. Watch how one origin request ends up serving many viewers, and
why that only works because the keys never change. The tabs replay an origin outage, a
deleted photo that is still cached, and private photos behind signed URLs.

```figure
read-path
```

### How it scales

The design changes as the library and the audience grow: one bucket, then a CDN and storage
tiers, then replicated buckets in several regions, then content addressing so identical bytes
are stored once.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Upload path | through the API · presigned PUT · presigned multipart | **Presigned**, multipart above ~100 MB | API servers stay small and stateless; parallel parts use the full bandwidth |
| Where metadata lives | object tags · listing the bucket · a database | **Database row per photo**, object key stored in it | Listing is slow and can't answer "Ana's photos from June"; the DB can |
| Key naming | user file names · random ids · content hash | **Random id + rendition** (`p_77/1080.webp`) | No overwrites, keys spread across partitions, and immutable keys cache forever |
| Processing trigger | inside the upload request · client calls "process" · store events to a queue | **Store events → queue** with retries and dead letters | Works even if the client disappears after upload; spikes become backlog |
| Serving reads | presigned GETs from the bucket · CDN with a private origin | **CDN**, signed URLs for private albums | Most views never reach the store; the bucket is never public |
| Storage cost | everything hot · lifecycle by age · by access pattern | **Lifecycle rules**: originals cool down, renditions stay hot | The bill is dominated by bytes nobody looks at |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Public data leak | A bucket policy or ACL opened by mistake | Every photo readable by anyone | Block public access account-wide, CDN-only origin access, signed URLs |
| Orphaned bytes | Uploads never completed, rows deleted without objects | Paying for storage nobody can see | Lifecycle rule that aborts incomplete multipart uploads, a store-vs-DB reconcile job |
| Missed or duplicate processing | Store notifications are at-least-once and sometimes late | Photos stuck pending or processed twice | Idempotent workers keyed by object key, a sweeper for old pending rows |
| Deleted but still served | CDN copies with year-long TTLs | Privacy complaints | Purge by prefix or tag on delete, shorter TTLs for private content |
| Accidental or malicious delete | A bug or a stolen credential deletes keys | Permanent loss, replicated to every region | Versioning, object lock on originals, least-privilege credentials |
| Request throttling | All writes under one key prefix | 503 SlowDown during spikes | Random ids at the start of keys, retries with backoff |
