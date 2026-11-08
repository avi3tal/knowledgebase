## Getting bytes in and out without your servers

Pushing a 2 GB video through your API servers wastes their bandwidth and memory, and ties up a
request for minutes. The standard move is to let the client talk to object storage
**directly**, with your service only granting permission (the tabs show the proxy alternative,
an expired URL and a leaked one):

```figure
presigned-upload
```

| upload path | bytes through your servers | API work | client trust |
|---|---|---|---|
| proxy through the API | all of them | stream GBs per request | full control, inspect on the fly |
| presigned direct PUT | none | one small JSON call | limited to one key, one verb, minutes |

> [!PROS] Presigned direct upload
> - API servers stay small and stateless; capacity for uploads is the store's problem.
> - Multipart and parallel parts work as usual, straight from the client.

> [!CONS] Presigned direct upload
> - You can't inspect bytes on the way in, so validation (type, virus scan, size) happens
>   afterwards, triggered by the upload event.
> - A leaked URL is usable until it expires: keep it short and scoped to one key.

Once the bytes land, the rest of the pipeline is event-driven, and reads go through a CDN (the tabs play out a transcoder crash, life without a
CDN, and a viral miss storm):

```figure
media-pipeline
```

- **[Presigned URLs](#/topic/system-design/presigned-urls)** are signed, short-lived links for
  one operation on one key. The API checks who you are; the storage checks the signature.
- **Upload events** start the processing pipeline through a
  [queue](#/learn/system-design/message-queues), so no one has to poll.
- **[CDN](#/topic/system-design/cdn) in front for reads.** Object storage is the origin. The
  edge serves the popular objects, so you pay storage egress once per edge, not once per view.

> [!INTERVIEW] What to say about media
> "Metadata in the database, bytes in object storage. Clients upload directly with a presigned
> URL, multipart for big files. The ObjectCreated event kicks off processing, and viewers read
> through a CDN with the store as origin."

## Lifecycle and cost
Objects get cold fast: most photos are viewed in their first days. Lifecycle rules move objects
to cheaper tiers after N days and delete old versions.

> [!NUMBERS] Why the tier decides the bill
> 100M photos/day × 2 MB × 3 sizes ≈ **600 TB/day** → ~219 PB after a year.
> 219,000 TB × $20 ≈ **$4.4M/month** all hot, vs ~$0.9M if last year sits in a 5× cheaper tier.

## Content-addressed parts (dedup)
If parts are keyed by a **hash of their content** instead of by file name, identical parts
are stored once and a file becomes a short manifest: a list of part hashes. Re-uploading a file
with one changed part sends one part, and ten users storing the same file share its bytes.

```figure
dedup-check
```

The catch is deletion: a part can only be removed once **no manifest** points to it, so you
need reference counting or a periodic garbage collector. See
[chunking and dedup](#/topic/system-design/chunking-dedup).

The trace below stores three files of 3 parts each. Two of them are byte-for-byte equal and the
third differs only in its last part. Predict how many parts actually get stored.
