# Solution: Dropbox (file sync)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
It is two systems glued together: a **byte path** (exabytes of immutable data, flaky uploads) and a
**metadata path** (a small, strongly ordered log of who changed what). The design works once you
separate them. Bytes become **content-addressed chunks** that go straight to object storage, and
metadata becomes an **ordered journal per folder** that drives versions, sync and conflict
detection.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Upload and download files up to 50 GB from any device |
| F2 | Changes sync automatically to the user's other devices and to collaborators |
| F3 | Version history: restore any version, including deleted files, for 30 days |
| F4 | Share folders with other users |
| F5 | Offline edits sync when the device reconnects |
| N1 | Durability: an acknowledged file is never lost |
| N2 | Changes visible on other online devices within ~10 s |
| N3 | Only changed chunks are transferred; uploads resume after a drop |
| N4 | No silent overwrites: all devices converge, concurrent edits are kept |
| N5 | Metadata available 99.9%+ |

**Assumptions:** 500M users, 100M DAU, ~2 devices online per DAU, 10 changes per DAU per day,
~1 MB per change, ~5 GB and ~1,000 files per user. **Out of scope:** real-time co-editing inside a
document, content search, billing.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| file changes | 100M × 10 / day | **11,600 /s** (peak ~35k) |
| upload bandwidth | 1B × 1 MB / day | **~12 GB/s** before dedup |
| logical storage | 500M × 5 GB | **2.5 EB** |
| after ~30% dedup | 2.5 EB × 0.7 | **~1.75 EB** |
| metadata | 500B rows × 1 KB | **~500 TB** |
| online devices | 100M × 2 | **200M** connections |
| naive polling every 30 s | 200M / 30 | **6.7M req/s**, almost all empty |

What the numbers say:
- Bytes are huge but simple (immutable, keyed by hash), so they belong in object storage.
- Metadata is small per row but needs ordering and transactions, and 500 TB still needs sharding.
- 200M devices make polling the most expensive part of the system, so notification needs its own
  design.

## 3. API and data model
- `POST /blocks/check {namespace_id, block_hashes[]}` → `{missing[], upload_urls}`.
- `PUT <presigned URL>` with ≤ 4 MB of chunk bytes. This goes to the storage edge, and it is
  idempotent because the key is the content hash.
- `POST /files/commit {namespace_id, path, block_hashes[], base_rev}` → `200 {rev, seq}`, or
  `409 conflict`, or `412 {missing}`.
- `GET /changes?cursor=` → `{entries[], cursor, has_more}`.
- `GET /notify?cursor=` long-polls for up to 60 s.
- `GET /files/{path}/revisions` returns the version history.

Entities:
- **`file_journal(namespace_id, seq, path, rev, block_hashes[], size, deleted, ts)`**: append-only,
  in SQL sharded by `namespace_id`. A namespace is a user's root or a shared folder.
- **`block_index(hash PK, size, ref_count)`**: in SQL sharded by hash.
- **`namespaces(namespace_id, members, mount paths)`**: who sees which shared folder, and where.
- **chunks** in the block store, keyed by SHA-256.

## 4. Decompose: the parts
### Part P1: Chunked, resumable upload with dedup (F1, N1, N3)
| option | pros | cons |
|---|---|---|
| whole file through app servers | simple | 50 GB pins servers; drops restart; 1-byte edit re-sends everything |
| whole file, presigned, to object storage | servers out of the byte path | still all-or-nothing, no dedup |
| **4 MB content-addressed chunks, only missing ones uploaded via presigned URLs** | dedup, per-chunk resume, parallel, servers see only hashes | a block index; smarter client; cross-user dedup can leak existence |

**Choice:** the client splits a file into 4 MB chunks and hashes each with SHA-256. It asks the
server which hashes are missing and PUTs only those, in parallel, through presigned URLs. Then it
commits the ordered hash list. A drop costs at most one chunk. If you dedup across users, a client
can probe whether a given file exists anywhere, so many teams dedup per user or per team instead.

```diagram
part:P1
```

### Part P2: Metadata and version history (F3, F4, N4)
| option | pros | cons |
|---|---|---|
| one SQL database | transactions, easy | 500 TB and ~35k commits/s don't fit one primary |
| NoSQL document per file | scales out | no transactions across files; no ordered change log |
| **SQL sharded by namespace, append-only journal** | transactions in a namespace; seq is both history and cursor | hot shards for huge shared folders; cross-namespace moves take two steps |

**Choice:** every commit appends a row with the next `seq` in its namespace. The latest row per
path is the current tree, all rows per path are the history, and rows with `seq > cursor` are what
a device must sync.

```diagram
part:P2
```

### Part P3: Sync: telling other devices about changes (F2, F5, N2)
| option | pros | cons |
|---|---|---|
| poll `/changes` every 30 s | stateless | 6.7M req/s, up to 30 s delay |
| push full payloads over WebSockets | lowest latency | per-device server state; reconnects still need replay |
| **long-poll signal, then pull the delta by cursor** | cheap idle connections; one catch-up path | ~2,000 connection servers; one extra round trip |

**Choice:** a commit publishes "namespace X is at seq n" to a stream. The notification service
wakes the long-polls subscribed to X, and each device calls `GET /changes?cursor=`. A device back
from a week offline uses exactly the same call.

```diagram
part:P3
```

### Part P4: Conflicts between devices (N4, F5)
| option | pros | cons |
|---|---|---|
| last writer wins | simple | silently drops an edit |
| locks / check-out | no conflicts | breaks offline; stuck locks |
| **optimistic commit on base_rev + conflicted copy** | never loses data; offline-friendly | users sometimes see a duplicate |
| automatic content merge | seamless for text | most files are binary |

**Choice:** a commit is `UPDATE … WHERE rev = base_rev`. When the base is stale, the server returns
409 and the client keeps its edit as `report (conflicted copy, Laptop, 2026-11-07).docx`, then
syncs the winner.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** whole-file upload into one service and one SQL table; devices poll. It breaks N3
(re-send everything), N2 (30 s polling) and capacity (2.5 EB in a DB).
```diagram
v1
```
**v2, compose P1 and P2:** bytes go as chunks through the storage edge into the block store;
metadata goes to the namespace-sharded journal. Other devices still poll, and concurrent edits can
still clobber each other.
```diagram
v2
```
**v3, compose P3 and P4:** commits are conditional on `base_rev` and emit change events; the
long-poll notification service wakes devices, which pull by cursor.
```diagram
v3
```

## 6. Deep dives
- **Chunk boundaries.** Fixed 4 MB chunks are cheap, but inserting a byte early in a big file shifts
  every later boundary. Content-defined chunking (rolling hash, ~4 MB average) survives inserts.
  The average change is ~1 MB (one chunk), so use fixed chunks by default and CDC only for large
  files of formats that are edited in place.
- **Chunk garbage collection.** Reference counts drift under retries, and one wrong decrement
  deletes a live chunk, which breaks N1. Run mark-and-sweep over the journal after the 30-day
  window, and delete only chunks that have been unreferenced for 7 more days.
- **Commit atomicity.** The server checks that every hash in the commit is in `block_index` before
  appending the journal row. A version therefore never points at missing bytes, and a retried
  commit with the same hashes is a no-op.
- **Hot shared folders.** A 50k-member company folder is one namespace, which means one shard and
  a big fan-out. Rate-limit commits per namespace, batch notifications, and split very large
  namespaces into sub-namespaces.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [Object storage](#/topic/system-design/object-storage) | chunks keyed by SHA-256, erasure-coded, presigned PUT/GET | an in-house block store |
| [PostgreSQL](#/topic/system-design/postgresql) | namespace-sharded journal and block index | MySQL (sharded), Spanner |
| [Kafka](#/topic/system-design/kafka) | namespace change events for the notifier | Redis pub/sub |
| [WebSockets / SSE](#/topic/system-design/websockets-sse) | long-poll or socket connections to devices | plain HTTP long-poll |

## 8. Patterns
- [Chunking and dedup](#/topic/system-design/chunking-dedup): content-addressed chunks give resume
  and dedup for free.
- [Presigned URLs](#/topic/system-design/presigned-urls): bytes bypass the app servers.
- [Optimistic concurrency](#/topic/system-design/optimistic-concurrency): commits on `base_rev`;
  conflicts become visible copies.
- [Real-time push](#/topic/system-design/real-time-push): a tiny "something changed" signal, then
  pull.
- [Idempotency](#/topic/system-design/idempotency): chunk PUTs and commits are safe to retry.
- The transferable shape is **separating bytes from metadata**: immutable content-addressed blobs
  plus an ordered metadata log that every client replays from a cursor. Photo libraries, package
  registries and backup systems reuse it.

## 9. Evaluation
- **Bottlenecks:** hot shared namespaces, notification fan-out for big folders, block index
  lookups during huge first uploads.
- **Failures:**
  - an upload drops: resume from the first missing chunk;
  - a metadata primary dies: failover to a synchronous replica, and commits pause for seconds;
  - a notify server dies: clients reconnect and pull by cursor, so nothing is lost;
  - storage is protected by erasure coding and cross-region copies.
- **Monitoring:** commit p99, 409 rate, an end-to-end "commit on A → visible on B" probe, upload
  resume and error rates, dedup ratio, notify connections, journal lag, GC bytes vs. expected.
- **The 30-second answer:** clients split files into 4 MB SHA-256 chunks and upload only the missing
  ones straight to object storage with presigned URLs. A metadata service commits the hash list into
  a per-namespace append-only journal in sharded SQL, conditional on the base revision, so conflicts
  become "conflicted copies". Each commit emits a change event; a long-poll notifier wakes the other
  devices, which pull the delta by cursor.

## 10. Tips and common mistakes
- Don't push file bytes through your API servers; say "presigned" early.
- "Store the file in S3 and the path in a DB" is only the start. The interesting parts are chunking,
  the journal and the cursor.
- Polling is the trap: do the 200M-devices arithmetic out loud.
- Last-writer-wins loses user data. In a storage product, that disqualifies it.
- Mention offline explicitly: it is why locks are wrong and why sync is cursor-based.

## 11. Learn more
- [File sync case study](#/topic/system-design/file-sync) and [blob storage](#/topic/system-design/blob-storage)
- [Sharding](#/learn/system-design/sharding) and [message queues](#/learn/system-design/message-queues)
- [Replication](#/topic/system-design/replication)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
