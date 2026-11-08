# Object Storage (S3)

> Technology · Ideas: buckets and keys, immutable objects, durability by replication / erasure coding, multipart and presigned uploads

Object storage keeps **blobs of bytes by key** in a flat namespace: `bucket/photos/2026/abc.jpg`
is just a long key, not a real folder. You `PUT` a whole object, `GET` it (or a byte range),
`DELETE` it, and `LIST` by key prefix. There is no in-place edit: changing one byte means writing
a new object or a new version. In return you get almost unlimited capacity, very high
durability, and a low price per GB.

```figure
put-get-path
```

## Numbers worth knowing

| property | ballpark | design consequence |
|---|---|---|
| durability | ~11 nines, across 3+ zones | the copy you never back up elsewhere |
| first-byte latency | ~20–100 ms | never on a hot per-request path; cache or CDN in front |
| throughput | ~100 MB/s per connection | parallel requests (multipart, ranged GETs) for big files |
| request rate | thousands/s per key prefix | spread hot keys over many prefixes |
| object size | up to ~5 TB; one PUT ~5 GB | multipart for anything large |
| price | hot ~$20/TB-month; cold 5–20× less | lifecycle rules decide the bill |

**How 11 nines is reached.** Either keep full **replicas** in three zones, or split the object
into fragments with **erasure coding**:

| scheme | storage used | survives | cost |
|---|---|---|---|
| 3 replicas | 3× | losing 2 copies | simple, fast reads, expensive |
| erasure code 6 + 3 | 1.5× | losing any 3 of 9 fragments | half the disk, but reads and repairs touch many nodes |

Large stores use erasure coding for most data; you only need to name the trade-off.

## The usual split
Put **metadata in a database** and **bytes in object storage**. The photos table holds
`photo_id, owner, caption, s3_key`; the 2 MB JPEG lives under `s3_key`. A database row
should never hold the media itself: rows get huge, backups slow down, and the database's
expensive disks fill with data that is just served as is.

> [!PITFALL]
> It's not a filesystem. "Renaming a folder" means copying and deleting every object under the
> prefix, and listing is a paginated scan. Design keys so you never need either.

## Multipart upload
A 4 GB upload over a phone link fails often. Multipart upload cuts the file into parts
(e.g. 8–100 MB each, numbered 1..n). Each part is a separate request that can be **sent in
parallel, retried alone, and arrive in any order**. A final *complete* call stitches the
parts together **by part number**. Until then, nothing is visible under the key. The tabs
compare one big PUT and play out an abandoned upload and the part-count limit.

```figure
multipart-parts
```

> [!NUMBERS] What multipart saves
> 4 GB / 64 MB = **64 parts**. A drop at 90% without multipart re-sends 4 GB; with it, one
> 64 MB part (1/64 of the file). Eight parts in flight at ~100 MB/s each also turns a
> 40-second single stream into about 5 seconds on a fast link.

Step through it below. The object is split into 6 parts, part 2 is retried, and the parts
arrive out of order. *Complete* still rebuilds the file in the right order.
