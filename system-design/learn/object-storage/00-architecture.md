## Architecture at a glance

Before buckets, durability and multipart, see the system an architect would draw. This is a game
studio's build and patch distribution: CI uploads 30–80 GB builds, each version is a manifest of
content-addressed chunks, and on patch day millions of players' launchers download only the
chunks they are missing. The object store is the centre, and no API server touches a byte. Play
the figure, then switch the tabs: patch day itself, the manifest database going down, and rolling
back a bad patch.

```figure
system-overview
```

### Zoom in: uploading a build

A build upload works like a multipart upload, parallel pieces retried one by one and a commit at
the end, except that each piece is its own object named by its hash. Watch how little of a 60 GB
build is actually sent. Then try the tabs: a chunk that fails, two pipelines uploading the same
chunk, and a reused chunk that lifecycle already moved to the archive.

```figure
chunk-upload
```

### Zoom in: the patch-day read path

Reads are where the volume is. Watch how pre-warming and the origin shield turn millions of
downloads into a handful of origin requests per chunk, and why that only works because chunk keys
never change. The tabs replay the design without a shield, a shield outage, and a hotfix shipped
in the middle of patch day.

```figure
patch-day-cdn
```

### How it scales

The design changes as the game and its audience grow: one bucket of zipped builds, then a CDN and
storage tiers, then replicated buckets in several regions, then content-addressed chunks so
uploads and patches carry only what changed.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Unit of storage | one archive per build · one object per file · content-addressed chunks | **Chunks** of about 8 MB, content-defined | A patch ships only changed chunks, and identical bytes across versions and branches are stored once |
| Object key | `game/2.3.0/file` · the chunk's SHA-256 | **Hash** (`chunks/9f2c…`) | Immutable keys cache forever, retries are idempotent, and keys spread evenly across partitions |
| What a version is | a bucket prefix to list · a manifest row plus a live pointer | **Manifest DB** with a live pointer | Release and rollback are one pointer change; listing a prefix can't say which version is live |
| Upload path | through the API · presigned PUT per new chunk | **Presigned PUTs**, only for hashes the index doesn't know | API servers stay small; CI sends a few GB instead of the whole build |
| Serving downloads | presigned GETs from the bucket · CDN · CDN + origin shield + pre-warm | **CDN with a shield and pre-warming** | Patch-day misses collapse into a few origin GETs per chunk |
| Storage cost | everything hot · lifecycle by age · lifecycle by reference | **Keep the last few live versions hot**, cool chunks only older builds use | Rollback and patches stay fast while the long tail of old builds gets cheap |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Origin stampede | cold edges at release, or a shield outage | 503 SlowDown, stalled downloads worldwide | Origin shield with request collapsing, pre-warming, release staggered by region |
| Bad patch | a broken build goes live | Crashes for everyone who updated | Rollback by pointer, staged rollout to a percentage of players first |
| GC deletes a live chunk | a reference-counting bug or a race with a new commit | Installs that can't complete or verify | Mark-and-sweep against every retained manifest, a grace period, bucket versioning |
| Corrupt or tampered chunk | bad bytes in transit, or a compromised mirror | Broken installs, or code run on players' machines | Checksums on upload, a hash check of every chunk by the launcher, signed manifests |
| Leak before launch | chunks are fetchable before the release flips | Content datamined and spoiled early | Private origin, signed URLs or encrypted chunks whose key ships with the live manifest |
| Egress bill | full downloads, a low hit ratio | Distribution costs more than storage by far | Delta patches, high cache TTLs, multi-CDN contracts, watching hit ratio per PoP |
