## What the traces show

Range partitioning by date puts 6 of the 9 keys (every key from this week) on shard 2, because
new data always has the largest key. Today's write traffic hits one node while the others idle.
Hash partitioning spreads the same keys 4 / 3 / 2. "All orders from November" would now touch
all three shards, though.

| | range | hash |
|---|---|---|
| point lookup by key | 1 shard | 1 shard |
| range scan on the key | few shards | **all** shards |
| sequential / time-ordered keys | **hot last shard** | even |
| skewed key (one huge tenant) | hot | still hot: one key is one shard |
| adding a shard | split a range | remap (use slots / ring) |

## Choosing a shard key
Pick the key that appears in **most hot-path queries** and has **many, evenly used values**:
- Chat messages → `conversation_id`: one conversation's messages stay together.
- Multi-tenant SaaS → `tenant_id`, but split the biggest tenants further.
- Time-series → a compound key `(device_id, day)`, so writes spread across devices while one
  device's day stays together.

Bad keys: low cardinality (country, status), monotonically increasing values with range
partitioning, or a column that most queries don't filter on.

## What gets harder after sharding
- **Cross-shard queries and joins:** denormalise, or keep a secondary index (local per shard
  means scatter-gather reads; global means its own partitioned table, updated asynchronously).
- **Cross-shard transactions:** avoid them by choosing the key so one business operation stays
  on one shard, or use sagas.
- **Rebalancing:** move data online with fixed slots (many more slots than nodes, and whole
  slots move) or by splitting ranges, without downtime.
- **Hot partitions:** a celebrity or giant tenant. Add a salt or suffix to spread that one key,
  or give it a dedicated shard.
- **Unique ids** can't come from one auto-increment any more. Use a distributed id scheme.
