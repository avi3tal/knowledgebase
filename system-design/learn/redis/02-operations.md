## TTLs, durability and scaling out

### TTL: data that cleans itself up
Any key can carry an expiry (`EXPIRE key 60`, or `SET key v EX 60`). Redis deletes it on its own.
Expiry is lazy (checked when the key is touched) plus a background sweep, so memory comes back
without a cleanup job. Many real uses depend on it:
- **Counters per window:** `INCR hits:{user}:{minute}` plus `EXPIRE` on the first hit.
- **Sessions and presence:** a heartbeat refreshes a 60 s TTL; a dead device disappears.
- **Leases and locks:** `SET lock:{id} owner NX PX 30000` creates the key only if it's absent and
  frees it automatically if the owner crashes. (Correctness across failover is the
  [distributed locking](#/topic/system-design/distributed-locking) topic.)

The trace at the end of this section counts requests per user with `INCR` (limit 3 per 10 s). The TTL starts on the first hit, and once
it passes the key is gone and the count starts again at 1.

### Durability: choose how much you may lose
| mode | what hits disk | lose on crash | cost |
|---|---|---|---|
| none | nothing | everything | fastest |
| **RDB snapshot** | a fork dumps memory every N minutes | minutes of writes | fork briefly doubles memory pages |
| **AOF, fsync every second** | every write appended to a log | about 1 s | ~10–20% throughput |
| AOF, fsync always | every write, synced | ~nothing | much slower writes |

Replication to replicas is **asynchronous**. A primary can acknowledge a write and fail before
the replica gets it. Treat Redis as the source of truth only for data you can rebuild or afford
to lose a second of.

### Redis Cluster: sharding built in
```
key ──crc16(key) % 16384──► slot ──► primary A (slots 0–5460)     + replica
                                    primary B (slots 5461–10922)  + replica
                                    primary C (slots 10923–16383) + replica
```
Every key belongs to one of 16 384 slots, and slots are spread over primaries. Multi-key commands
work only when all keys are in the same slot. Force that with a hash tag: `{user42}:cart` and
`{user42}:views` share a slot. Six primaries at ~100k ops/s each give ~600k ops/s.

One key still lives on one node. A viral key can saturate its shard: that's the
[hot keys](#/learn/system-design/hot-keys) problem.
