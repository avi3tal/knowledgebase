## Durability: choose how much you may lose

| mode | what hits disk | lose on crash | cost |
|---|---|---|---|
| none | nothing | everything | fastest |
| **RDB snapshot** | a fork dumps memory every N minutes | minutes of writes | the fork can briefly double memory pages |
| **AOF, fsync every second** | every write appended to a log | about 1 s | ~10–20% throughput |
| AOF, fsync always | every write, synced | ~nothing | much slower writes |

Disk is only half the story. Replication to replicas is **asynchronous**:

The tabs add `WAIT`, a stale read from a replica, and split brain during a partition.

```figure
async-replication
```

> [!PITFALL] "It's replicated, so it's safe"
> Replicas protect against losing the *machine*, not against losing the last writes. Treat Redis
> as the source of truth only for data you can rebuild or can afford to lose a second of.
> Commands like `WAIT` reduce the gap but don't make Redis a consensus system.

## Redis Cluster: sharding built in

The tabs play a primary failure, a cross-slot command, and the single-primary alternative.

```figure
cluster-slots
```

Every key belongs to one of **16 384 slots**, and slots are spread over primaries. Multi-key
commands and Lua scripts work only when all their keys are in the same slot. Force that with a
**hash tag**: `{user42}:cart` and `{user42}:views` hash only `user42`, so they share a slot.

> [!NUMBERS] Sizing a cluster
> - Throughput: 6 primaries × ~100k ops/s ≈ **600k ops/s**.
> - Memory: 300 GB of data ÷ 50 GB per node ≈ 6 primaries, plus one replica each = **12 nodes**.
> - A slot is the unit of rebalancing: moving 1 of 16 384 slots moves ~0.006% of the keys.

> [!CONS]
> - No cross-slot transactions or multi-key commands without hash tags.
> - One key still lives on one node. A viral key can saturate its shard: that's the
>   [hot keys](#/learn/system-design/hot-keys) problem, and more shards don't fix it.
