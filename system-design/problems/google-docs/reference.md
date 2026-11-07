# Solution: Google Docs (collaborative editing)

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
Most systems spread a hot object over many machines. This one does the opposite: it brings **every
editor of one document to a single owner process**. That owner can then put concurrent edits in one
order and transform them so that all copies converge. The rest follows from that choice:
- a log of tiny operations instead of whole-document saves;
- leases so there is never more than one owner;
- presence kept as soft state in the owner's memory.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Several users edit one document concurrently and converge to the same text |
| F2 | Others' edits appear in real time |
| F3 | Version history: browse and restore revisions |
| F4 | Presence: who is here, their cursors and selections |
| F5 | Short offline periods: keep typing, sync on reconnect |
| N1 | Edits reach others within ~200 ms p99 in-region; local typing never waits |
| N2 | Convergence with intent preserved |
| N3 | An acknowledged edit is never lost |
| N4 | 99.95% available; a server crash interrupts a session for seconds |

**Assumptions:** 1B docs × 50 KB; 20M connected and 5M typing at peak, ~1 op batch/s each; ≤ 100
editors per document. **Out of scope:** sheets/slides, comments and suggestions, search, active-active
multi-region editing of one document.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| ops | 5M typists × 1 /s | **5M /s** globally |
| busiest single doc | 100 editors × 5 /s | **~500 /s** |
| op log growth | 5M × 100 B × 86,400 | **~43 TB/day** |
| snapshots | 1B × 50 KB | **50 TB** |
| sockets | 20M at ~50k per server | **~400 collaboration servers** |
| naive "save whole doc per edit" | 5M × 50 KB | **250 GB/s** of writes |

The global numbers are large but spread across documents. The busiest single document needs only
~500 ops/s, which one process handles easily. That is why one owner per document works.

## 3. API and data model
- `POST /docs {title}` → `201 {doc_id}`.
- `GET /docs/{id}` → `{snapshot, rev, acl}`, the latest snapshot folded with the op-log tail.
- `WS /docs/{id}/session?rev=`:
  - the client sends `{op, base_rev, client_seq}` or `{cursor}`;
  - the server answers with `{ack rev}`, `{op, rev, author}` or `{presence}`.
- `GET /docs/{id}/revisions` lists the history. Restoring a revision is just a new op.

Entities:
- **`op_log(doc_id, rev, op, author, client_seq, ts)`** in a wide-column store partitioned by
  `doc_id`. `client_seq` makes resends idempotent.
- **`snapshots(doc_id, rev, state)`** in object storage.
- **`docs(doc_id, title, owner, acl, last_rev)`** in SQL.

## 4. Decompose: the parts
### Part P1: Real-time session and transport (F2, N1, N4)
| option | pros | cons |
|---|---|---|
| HTTP polling | stateless | up to 1 s late; ~20M mostly empty req/s |
| SSE down + POST up | simple push | two channels to keep in order |
| **WebSocket to the doc's owner (route by doc_id + lease)** | one ordered duplex channel; state in memory | stateful routing and failover |
| WebRTC peer-to-peer | no server hop | no central order or persistence; NAT |

**Choice:** the load balancer routes by `doc_id` (consistent hashing) to a collaboration server.
That server holds an etcd lease for the document, so there is exactly one owner.

```diagram
part:P1
```

### Part P2: Concurrency control: OT vs CRDT (F1, F5, N2)
| option | pros | cons |
|---|---|---|
| paragraph locks | no merge logic | people wait; stuck locks |
| last write wins | trivial | loses work |
| **Operational Transformation, central order** | compact ops; mature for rich text; fits a single owner | subtle transform functions; needs the server |
| CRDT (sequence with per-character ids) | merges in any order; offline/P2P | per-character metadata and tombstones |

**Choice: OT.** Each client sends one outstanding batch based on `base_rev` and waits for the ack.
The owner transforms the batch against ops `base_rev+1 … now`, assigns the next `rev` and
broadcasts it. Example: Alice inserts "x" at 10 while Bob deletes position 5. Bob's delete lands
first, so Alice's insert shifts to 9. A CRDT would be the better choice if offline-first or
peer-to-peer were in scope.

```diagram
part:P2
```

### Part P3: Persistence: op log and snapshots (F3, N3)
| option | pros | cons |
|---|---|---|
| save the whole doc per change | simple reads | ~250 GB/s; no history |
| op log only | tiny writes, full history | opening replays millions of ops |
| **op log before ack + async snapshots every ~500 ops** | durable, small, fast open | two stores; a snapshot job |

**Choice:** the owner appends each op to the log, and only then acks and broadcasts it. Ops also
go to a stream; a snapshotter folds them into a snapshot every ~500 ops. Opening a document loads
the latest snapshot and replays a short tail.

```diagram
part:P3
```

### Part P4: Presence and cursors (F4)
| option | pros | cons |
|---|---|---|
| persist cursors | survives restarts | a write per mouse move, for useless data |
| Redis pub/sub across servers | works if editors are spread out | unnecessary hop: one owner per doc |
| **soft state in the owner's memory, ≤ 10 Hz** | free; same socket | lost on failover; clients resend |

**Choice:** presence lives only in the owner's memory, is throttled, and expires on heartbeat
timeout. Cursor positions are transformed by concurrent ops just like edits, or they would jump.

```diagram
part:P4
```

## 5. Reduce: the high-level design
**v1, naive:** save the whole document every few seconds and poll for changes, with last write
wins. Concurrent typing destroys work.
```diagram
v1
```
**v2, compose P1 and P2:** WebSockets routed by `doc_id` to a leased owner that orders edits with
OT. The document only lives in that server's memory, though, so a crash loses acked edits.
```diagram
v2
```
**v3, compose P3 and P4:** the op log is appended before every ack, and snapshots come from the op
stream. Presence rides the same socket and is never stored.
```diagram
v3
```

## 6. Deep dives
- **Owner crash.** The lease (~5 s TTL) expires. Another server acquires it, loads the snapshot and
  the log tail, and clients reconnect with their last acked `rev`. Nothing acked is lost, because
  acks follow the log append. The lease revision is a **fencing token** on appends, so a paused old
  owner can't write.
- **Reconnect after offline.** The client keeps pending ops and its last acked `rev`. On reconnect
  it receives ops since that rev, transforms its pending ops against them and resends them; a
  repeated `client_seq` is ignored. Past a cap (say 24 h), it offers to save a copy instead.
- **Huge audiences.** 5,000 viewers on one document would swamp its owner. Viewers instead get
  read-only replicas that subscribe to the op stream, and only editors connect to the owner.
- **Undo.** Undo is local: it produces the inverse op, transformed like any other, so it never
  undoes someone else's typing.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [WebSockets / SSE](#/topic/system-design/websockets-sse) | full-duplex editor ↔ owner channel | SSE + POST |
| [etcd / ZooKeeper](#/topic/system-design/zookeeper-etcd) | per-document ownership leases, fencing | a lease table in a strongly consistent DB |
| [Envoy / NGINX](#/topic/system-design/envoy-nginx) | WebSocket termination, routing by doc_id | cloud L7 load balancer |
| [Cassandra](#/topic/system-design/cassandra) | op log partitioned by doc_id | Bigtable, DynamoDB |
| [Kafka](#/topic/system-design/kafka) | committed op stream for snapshotter and viewers | Pulsar |
| [Object storage](#/topic/system-design/object-storage) | snapshots | a blob column |

## 8. Patterns
- [Collaborative editing](#/topic/system-design/collaborative-editing): OT vs CRDT, the core of
  this problem.
- [Real-time push](#/topic/system-design/real-time-push): ops and presence pushed over one socket.
- [Event sourcing](#/topic/system-design/event-sourcing): the op log is the truth; snapshots are a
  cache of it.
- [Distributed locking](#/topic/system-design/distributed-locking): a lease plus a fencing token
  per document.
- The transferable shape is **single-owner stateful sessions**: route everyone touching one object
  to one leased owner, order there, log before ack, and snapshot asynchronously. Multiplayer game
  rooms, whiteboards and live auctions reuse it.

## 9. Evaluation
- **Bottlenecks:** very popular documents (handled by viewer replicas), reconnect storms after a
  server dies (jittered backoff), and op-log latency on the ack path.
- **Failures:**
  - owner crash: lease takeover, then rebuild from snapshot plus tail;
  - log append failure: no ack, so the client retries;
  - snapshotter down: opens get slower, nothing is lost;
  - network drop: the offline buffer catches up by `rev`.
- **Monitoring:** edit propagation p99 (sender to peers), ack latency, ops per doc, sockets per
  server, lease takeovers, op-log append latency, snapshot lag, and transform errors.
- **The 30-second answer:** each editor opens a WebSocket routed by `doc_id` to a collaboration
  server that holds the document's lease. The owner orders edits with Operational Transformation,
  appends each op to a log partitioned by `doc_id` before acking, and broadcasts it. A snapshotter
  folds the op stream into snapshots for fast opens and history. Presence and cursors are soft state
  in the owner's memory.

## 10. Tips and common mistakes
- Don't say "use a CRDT" or "use OT" without the trade-off. Interviewers want to hear why one fits
  *this* architecture.
- Saving the whole document per keystroke is the classic naive answer; do the 250 GB/s arithmetic.
- Ack only after the op is durable, or "saved" is a lie.
- Two owners for one document (split brain) silently diverges copies; mention leases *and* fencing.
- Keep presence out of the database.

## 11. Learn more
- [Collaborative editor case study](#/topic/system-design/collaborative-editor)
- [Consensus and coordination](#/topic/system-design/consensus-coordination) and [consistent hashing](#/learn/system-design/consistent-hashing)
- [Load balancing](#/learn/system-design/load-balancing) for sticky WebSocket routing
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
