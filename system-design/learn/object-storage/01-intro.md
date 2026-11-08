# Object Storage (S3)

> Technology · Ideas: buckets and keys, immutable objects, durability by replication / erasure coding, multipart and presigned uploads

Object storage keeps **blobs of bytes by key** in a flat namespace: `bucket/photos/2026/abc.jpg`
is just a long key, not a real folder. You `PUT` a whole object, `GET` it (or a byte range),
`DELETE` it, and `LIST` by key prefix. There is no in-place edit: changing one byte means writing
a new object or a new version. In return you get almost unlimited capacity, very high
durability, and a low price per GB.

```
client ──PUT /bucket/key──► front end ──► metadata index   (key → where the bytes live, size, etag)
                                     └──► storage nodes    (the bytes, spread across disks / zones)
client ◄─GET (Range: bytes=0-1048575)─┘
```

## Numbers worth knowing
```
durability   ~11 nines: replicas or erasure coding across 3+ availability zones
latency      first byte ~20–100 ms (much slower than a KV store or a local disk)
throughput   ~100 MB/s per connection; scale by running many requests in parallel
request rate thousands of PUTs/GETs per second per key prefix; spread hot keys over prefixes
object size  bytes up to ~5 TB; a single PUT is capped (~5 GB), so big files use multipart
price        hot tier ~$20/TB-month; cold / archive tiers 5–20× cheaper, with slower reads
```

## The usual split
Put **metadata in a database** and **bytes in object storage**. The photos table holds
`photo_id, owner, caption, s3_key`; the 2 MB JPEG lives under `s3_key`. A database row
should never hold the media itself: rows get huge, backups slow down, and the database's
expensive disks fill with data that is just served as is.

## Multipart upload
A 4 GB upload over a phone link fails often. Multipart upload cuts the file into parts
(e.g. 8–100 MB each, numbered 1..n). Each part is a separate request that can be **sent in
parallel, retried alone, and arrive in any order**. A final *complete* call stitches the
parts together **by part number**. Until then, nothing is visible under the key.

Step through it below. The object is split into 6 parts, part 2 is retried, and the parts
arrive out of order. *Complete* still rebuilds the file in the right order.
