## What the traces show

Range partitioning by date puts 6 of the 9 keys (every key from this week) on shard 2, because
new data always has the largest key. Today's write traffic hits one node while the others idle.
Hash partitioning spreads the same keys 4 / 3 / 2. "All orders from November" would now touch
all three shards, though.

## Directory partitioning
The third option keeps an explicit **lookup table**: key (or tenant) → shard. The shard map in
the first figure becomes a small, replicated database of its own.

> [!PROS]
> - Any placement you like: put a giant tenant on its own shard, move one tenant at a time.
> - Rebalancing is just updating rows in the directory.

> [!CONS]
> - An extra lookup per request (cache it), and the directory must be highly available: if it's
>   down, nothing can be routed.
> - One more system to keep consistent while data moves.

| | range | hash | directory |
|---|---|---|---|
| point lookup by key | 1 shard | 1 shard | lookup + 1 shard |
| range scan on the key | few shards | **all** shards | depends on placement |
| sequential / time-ordered keys | **hot last shard** | even | even if you place well |
| one huge key or tenant | hot | still hot | give it a dedicated shard |
| adding a shard | split a range | move slots (not `% N`) | update the table |
| extra moving parts | boundaries | slot map | a directory service |

## Rebalancing without moving everything

> [!NUMBERS] `% N` vs fixed slots, going from 3 to 4 shards
> - `hash % N`: a key stays only if `h % 3 == h % 4`, which holds for about 1 key in 4, so
>   **~75%** of all data moves. From 10 to 11 shards it's ~91%.
> - Fixed slots (say 1024 slots, slot = `hash % 1024`, slots assigned to shards): the new shard
>   takes 1024 / 4 = 256 slots, so only **~25%** of data moves, which is the minimum possible.

The figure's tabs show what happens if the move crashes, how a router with a stale map recovers, and the `% N` alternative.

```figure
resharding
```

## Choosing a shard key
Pick the key that appears in **most hot-path queries** and has **many, evenly used values**:
- Chat messages → `conversation_id`: one conversation's messages stay together.
- Multi-tenant SaaS → `tenant_id`, but split the biggest tenants further.
- Time-series → a compound key `(device_id, day)`, so writes spread across devices while one
  device's day stays together.

Bad keys: low cardinality (country, status), monotonically increasing values with range
partitioning, or a column that most queries don't filter on. Every query that skips the key
pays this (the tabs add a shard timing out, a cross-shard top 10, and the global-index fix):

```figure
scatter-gather
```

## What gets harder after sharding
- **Cross-shard joins:** denormalise, or keep a secondary index (local per shard means
  scatter-gather reads; global means its own sharded table, updated asynchronously).
- **Cross-shard transactions:** choose the key so one business operation stays on one shard,
  or use sagas.
- **Hot partitions:** a celebrity or giant tenant. Add a salt or suffix to spread that one key,
  or give it a dedicated shard.
- **Unique ids** can't come from one auto-increment any more. Use a distributed id scheme.
