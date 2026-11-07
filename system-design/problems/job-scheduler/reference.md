# Solution: distributed job scheduler

*One good answer, not the only one. Practise first if you can: reading this before your first attempt
removes the first-try bonus.*

## What makes it distinctive
The input is **time**, not requests. Nothing calls the system when a job is due. It has to notice on
its own, every second, among 50M definitions, and it can't rely on a single box to do that. On top of
that, exactly-once execution is impossible, so the design is really about three things:
- making "what is due" cheap;
- giving each slice of jobs exactly one owner;
- making duplicates harmless.

## 1. Requirements and assumptions
| id | requirement |
|---|---|
| F1 | Schedule one-off (run_at / delay) or cron jobs with a handler and payload; pause, edit, cancel |
| F2 | Execute each job at its scheduled time on a pool of workers |
| F3 | Retry with backoff up to N attempts, then dead-letter |
| F4 | Status and history of every run for 30 days |
| N1 | Start within 2 s of the scheduled time (p99), including top-of-the-hour spikes |
| N2 | At-least-once: no run is lost when a node dies; duplicates are made harmless |
| N3 | 100M runs/day, 50M definitions, no single point of failure |
| N4 | Definitions are durable; edits are consistent with dispatch |

**Assumptions:** runs average 30 s and last up to 1 h; handlers are external endpoints; `:00` is 10×
the average. **Out of scope:** DAG dependencies, code packaging and sandboxing.

## 2. Scale numbers
| quantity | formula | ≈ |
|---|---|---|
| definitions | 50M × 1 KB | **50 GB** |
| dispatch rate | 100M / 86,400 s | **~1,160 /s** |
| peak at `:00` | × 10 | **~12,000 /s** |
| concurrent runs | 1,160/s × 30 s | **~35,000** |
| executor hosts | 35k / 50 slots | **~700** |
| run history, 30 days | 100M × 30 × 500 B | **~1.5 TB** |

What the numbers say:
- 50 GB of definitions fits a few SQL shards, so storage is not the hard part. **Finding due rows**
  and the **12k/s burst** are.
- Run history is write-heavy and append-only (100M rows/day), so it belongs in a different store from
  the definitions.

## 3. API and data model
- `POST /jobs {name, schedule: cron | run_at | delay, handler, payload, retry_policy, timeout}` with
  an `Idempotency-Key` → `201 {job_id, next_run_at}`.
- `PATCH /jobs/{id}` (edit, pause) with a version check; `DELETE /jobs/{id}`.
- `GET /jobs/{id}/runs?status&from` → runs with attempt, status, timings and error.

| entity | fields | store |
|---|---|---|
| `jobs` | job_id, owner, schedule, **next_run_at**, handler, payload, retry_policy, timeout, status, version | Postgres, partitioned by hash(job_id), index on next_run_at |
| `job_runs` | run_id = job_id + scheduled_at, attempt, status, started_at, finished_at, error | wide-column / DynamoDB, TTL 30 days |
| `partition_leases` | partition → scheduler, TTL | etcd |

`next_run_at` is the key design move. It turns "which cron expressions match this second?" into an
indexed range query.

## 4. Decompose: the parts
Four sub-problems, in the order a job experiences them.

### Part P1: Job definitions and the schedule store (F1, N4)
| option | pros | cons |
|---|---|---|
| key-value store by job_id | trivial to scale | no good "what's due next" query; a time index becomes a hot partition |
| **SQL partitioned by hash(job_id), index on next_run_at** | indexed range query; claim and advance in one transaction | must partition; the index is updated on every run |

**Choice:** Postgres with ~64 logical partitions spread over a few physical shards. The API computes
`next_run_at` from the cron expression, in the job's time zone, on create and on every edit.

```diagram
part:P1
```

### Part P2: Finding due jobs without a full scan (F2, N1, N3)
| option | pros | cons |
|---|---|---|
| one cron box scans everything each second | trivial | O(50M) per tick; single point of failure |
| **indexed range per partition, one leased scheduler per partition** | reads only due rows; failover by lease | polling per partition; a few seconds' gap on handover |
| in-memory priority queue / Redis sorted set by run_at | sub-second precision | a second source of truth to keep in sync |
| time-bucketed table + in-memory timer wheel | O(due) reads at huge one-off volumes | more moving parts |

**Choice:** each scheduler holds leases on some partitions in etcd. Every second, for each leased
partition, it runs:

```
BEGIN;
SELECT … FROM jobs WHERE next_run_at <= now() + interval '5 s' AND status = 'active'
  ORDER BY next_run_at LIMIT 1000 FOR UPDATE SKIP LOCKED;
-- enqueue one run per row; set next_run_at = next cron time (or done for one-offs)
COMMIT;
```

At peak, that is ~12k/s over 64 partitions, about 200 rows per partition per second. Claiming and
advancing in one transaction means a crash rolls back cleanly: the rows are still due and get picked
up by the next lease holder. Enqueue to the run queue before `COMMIT`. If the commit then fails, the
same occurrence may be enqueued twice, and the deterministic run_id from P3 makes that harmless.

```diagram
part:P2
```

### Part P3: Dispatch and execution: at-least-once with leases (F2, N2)
| option | pros | cons |
|---|---|---|
| scheduler calls the handler directly | fewest hops | slow jobs block scheduling; a crash loses in-flight runs |
| **queue with visibility timeout; executors pull and heartbeat** | crashed runs reappear automatically; executors scale independently | at-least-once: a stalled executor can cause a second run |
| exactly-once via distributed transactions | no duplicates on paper | external handlers can't join a transaction |

**Choice:** the run queue hides a message for its visibility timeout (say 60 s). An executor
heartbeats to extend it during long runs, and deletes the message on success. Each run carries
`run_id = job_id + scheduled_at`, passed to the handler as `Idempotency-Key`. Executors write status to
`job_runs` with a conditional update on the attempt number.

```diagram
part:P3
```

### Part P4: Retries, dead letters and status visibility (F3, F4)
| option | pros | cons |
|---|---|---|
| retry immediately in the executor | fast for blips | hammers a broken dependency; holds slots |
| infinite retries | never gives up | poison jobs loop forever |
| **backoff + jitter via next_run_at, DLQ after max attempts** | gives dependencies room; bounds poison jobs | slower recovery; needs a DLQ workflow |

**Choice:** a failed run reschedules itself with `next_run_at = now + base × 2^attempt ± jitter`, so
retries flow through the same due-job path with no second timer system. After the last attempt, the
run goes to a dead-letter queue. A triage worker alerts the owner, who can redrive it once it's fixed.
Every attempt lands in `job_runs`, which the API reads.

```diagram
part:P4
```

## 5. Reduce: the high-level design
Merge the parts by node id.

**v1, naive:** a single cron service scans the jobs table every second and runs jobs inline. It is a
single point of failure (N3), it does an O(50M) scan per tick (N1), and a crash loses runs (N2).
```diagram
v1
```
**v2, compose P1 and P2:** the Job API behind a load balancer, the partitioned jobs store with a
`next_run_at` index, leased schedulers, and a run queue feeding executors.
```diagram
v2
```
**v3, compose P3:** visibility timeouts and heartbeats, idempotency keys, and the `job_runs` table.
```diagram
v3
```
**v4, compose P4:** backoff through `next_run_at`, the dead-letter queue with triage and redrive, and
run history in the API.
```diagram
v4
```

## 6. Deep dives
- **Duplicates.** Duplicates come from three places: a visibility timeout firing on a slow executor, a
  scheduler failing between enqueue and commit, and a lease handover. All of them carry the same
  `run_id`, because it is derived from the occurrence, not generated at random. Handlers dedupe on it,
  and `job_runs` only advances from the expected attempt.
- **Top-of-the-hour spikes.** Claim 5 s ahead so the queue already holds the 09:00 runs at 08:59:55.
  Autoscale executors on queue depth and age. Offer an opt-in jitter window: most `0 * * * *` jobs
  don't care whether they start at 09:00:00 or 09:00:40, and spreading them turns 10× into ~1.5×.
- **Edits and cancels racing dispatch.** A cancel after a run was enqueued is checked by the executor
  against the job's status and version before invoking. `PATCH` uses an optimistic version check so an
  edit doesn't overwrite a concurrent `next_run_at` advance.
- **Long runs.** A one-hour run heartbeats every 20 s. Its timeout is per job, so it is never
  confused with a dead executor.
- **Clock skew.** Schedulers compare against the database's `now()`, not their own clocks.

## 7. Technologies
| technology | role here | alternatives |
|---|---|---|
| [PostgreSQL](#/topic/system-design/postgresql) | `jobs` with the next_run_at index; claim + advance transactions | MySQL, CockroachDB |
| [etcd / ZooKeeper](#/topic/system-design/zookeeper-etcd) | partition leases: one scheduler per partition | Postgres advisory locks, Consul |
| [Kafka](#/topic/system-design/kafka) | run queue partitioned by job (or SQS for per-message visibility timeouts) | SQS, RabbitMQ |
| [DynamoDB](#/topic/system-design/dynamodb) | `job_runs` history with TTL | Cassandra |

Kafka has no per-message visibility timeout. With Kafka, the executor commits offsets after
completion, and a separate lease table tracks long runs. SQS or RabbitMQ give you visibility timeouts
natively. Pick by what the team already runs.

## 8. Patterns
- [Distributed locking](#/topic/system-design/distributed-locking): leases give each partition
  exactly one scheduler, with automatic failover.
- [Idempotency](#/topic/system-design/idempotency): a deterministic run_id makes at-least-once safe.
- [Retries and DLQ](#/topic/system-design/retries-dlq): exponential backoff with jitter, then park.
- [Backpressure](#/topic/system-design/backpressure): the run queue absorbs bursts; executors pull at
  their own pace.
- The transferable shape is **time-triggered work**. Index work by its due time, give each partition
  one leased owner that claims and advances atomically, and execute through a queue with leases.
  Reminder systems, delayed message delivery and subscription renewals have the same shape.

## 9. Evaluation
- **Bottlenecks:** the jobs store, because every run advances `next_run_at`; per-partition polling at
  `:00`; and executor slots held by slow handlers.
- **Failures:** if a scheduler dies, its lease expires in ~10 s and another takes over. If an executor
  dies, the visibility timeout re-queues the run. If a handler is down, the run backs off, then goes to
  the DLQ.
- **Monitoring:** schedule lag (actual start − scheduled_at) p99, due-but-unclaimed rows per partition,
  queue depth and oldest-message age, executor utilisation, retry and DLQ rates, lease handovers.
- **The 30-second answer:** store jobs in Postgres partitioned by job_id with an indexed `next_run_at`.
  One scheduler per partition, chosen by an etcd lease, claims due rows with `FOR UPDATE SKIP LOCKED`
  a few seconds ahead, enqueues runs and advances `next_run_at` in the same transaction. Executors pull
  from a queue with visibility timeouts and heartbeats, and call handlers with
  `Idempotency-Key = job_id + scheduled_at`. Failures back off through `next_run_at` and end in a
  DLQ, and every attempt is recorded in a `job_runs` table with a 30-day TTL.

## 10. Tips and common mistakes
- Don't say "a cron job checks the table". Explain how you avoid the full scan and the single box.
- Don't promise exactly-once. Promise at-least-once, and say who makes duplicates harmless.
- A random run_id defeats deduplication. Derive it from job_id and scheduled time.
- Separate *deciding when* (schedulers) from *doing* (executors). They scale and fail differently.
- Mention the top-of-the-hour spike. It is the interviewer's favourite follow-up.

## 11. Learn more
- [Message queues](#/learn/system-design/message-queues) and [retries and DLQ](#/topic/system-design/retries-dlq)
- [Consensus and coordination](#/topic/system-design/consensus-coordination) and [distributed locking](#/topic/system-design/distributed-locking)
- [Sharding](#/learn/system-design/sharding) and [idempotency](#/topic/system-design/idempotency)
- [Back-of-the-envelope estimation](#/learn/system-design/back-of-envelope)
