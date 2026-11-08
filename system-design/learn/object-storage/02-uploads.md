## Getting bytes in and out without your servers

Pushing a 2 GB video through your API servers wastes their bandwidth and memory, and ties up a
request for minutes. The standard move is to let the client talk to object storage
**directly**, with your service only granting permission:

```
1. client ──"I want to upload clip.mp4"──► API      (auth, quota, create metadata row: pending)
2. API    ──presigned PUT URL (expires 15 min)──► client
3. client ══bytes (multipart, parallel)══► object storage
4. storage ──"object created" event──► queue ──► workers (transcode, thumbnail, mark ready)
5. viewers ──GET──► CDN ──(miss)──► object storage
```

- **[Presigned URLs](#/topic/system-design/presigned-urls)** are signed, short-lived links for
  one operation on one key. The API checks who you are; the storage checks the signature.
- **Upload events** (step 4) start the processing pipeline through a
  [queue](#/learn/system-design/message-queues), so no one has to poll.
- **[CDN](#/topic/system-design/cdn) in front for reads.** Object storage is the origin. The
  edge serves the popular objects, so you pay storage egress once per edge, not once per view.

## Content-addressed parts (dedup)
If parts are keyed by a **hash of their content** instead of by file name, identical parts
are stored once and a file becomes a short manifest: a list of part hashes. Re-uploading a file
with one changed part sends one part, and ten users storing the same file share its bytes.
The catch is deletion: a part can only be removed once **no manifest** points to it, so you
need reference counting or a periodic garbage collector. See
[chunking and dedup](#/topic/system-design/chunking-dedup).

The trace below stores three files of 3 parts each. Two of them are byte-for-byte equal and the
third differs only in its last part. Predict how many parts actually get stored.

## Lifecycle and cost
Objects get cold fast: most photos are viewed in their first days. Lifecycle rules move objects
to cheaper tiers after N days and delete old versions. At 100 M photos/day × 2 MB × 3 sizes,
that is ~600 TB a day, so the tier you keep last year's data on decides the bill.
