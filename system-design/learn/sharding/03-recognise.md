## How to recognise you need it

**Strong signals:**
- Data size in the **tens of TB or more**, or growing past what one node's disk holds.
- **Write** QPS beyond one primary (tens of thousands of writes/s for a typical relational DB).
- Clear natural partitions: per user, per tenant, per conversation, per device.

**Look-alikes, and why they're different:**
- **Replication** copies the **same** data to more machines. It scales reads and availability,
  but every replica still takes every write and stores everything.
- **Caching** absorbs repeated reads and does nothing for write volume or storage.
- **Consistent hashing** is a placement technique **inside** hash sharding (or caches). It
  answers "which node holds partition P, and what moves when nodes change", not "how should I
  split the data".
- **Message queues** smooth a write **burst**. They don't raise the sustained write capacity
  of the database behind them.

> [!INTERVIEW] How to bring up sharding
> Start with the estimate: "50k writes/s and 40 TB is past one primary, so we shard." Then name
> the key and why: "by `conversation_id`, because every hot query (load a chat, append a
> message) includes it." Say what becomes scatter-gather ("search by user is now a global index")
> and how you rebalance ("fixed slots, moved online"). Mention the hot-key plan last.

> [!PITFALL] Interview pitfalls
> - Sharding too early. Say first that one well-tuned primary plus replicas and a cache handles
>   more than people think, and back it with an estimate.
> - Naming "shard by user_id" without checking which queries then become scatter-gather.
> - Range-partitioning on a timestamp and not noticing the hot last shard.
> - Forgetting the rebalancing story, and that `% N` moves almost everything.
