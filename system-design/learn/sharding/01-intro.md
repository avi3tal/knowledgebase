# Sharding and Partitioning

> Building block · Ideas: shard key, range vs hash vs directory partitioning, rebalancing, hot partitions

**The problem.** Caching and read replicas help with **reads**, but every replica still takes
every write and stores every row. Once **writes** or **total data size** outgrow one machine
(disk full, write IOPS maxed, indexes no longer fit in memory), buying a bigger box only delays
the problem, and the biggest box is a single point of failure.

**The fix.** Split the data itself. Each **shard** (partition) holds a disjoint subset of rows,
lives on its own node and usually has its own replicas. A router turns the **shard key** into
a shard:

```figure
shard-router
```

> [!NUMBERS] When one node stops being enough
> - One relational primary: roughly **5k–20k writes/s** and a comfortable **1–5 TB**.
> - 50k writes/s ÷ ~10k per shard → **5 shards**, plus headroom: plan for 8.
> - 40 TB ÷ ~2 TB per shard → **20 shards**. Size by whichever limit you hit first.

Everything depends on the **shard key**, the column that decides where a row lives:
- Queries that include the shard key go to **one** shard, which is fast.
- Queries without it must go to **all** shards (scatter-gather), which is slow and fragile.
- A key with skewed values creates **hot shards**.

## Range partitioning
Each shard owns a contiguous key range: `[a, h)`, `[h, p)`, `[p, z]`.

> [!PROS]
> - Range scans are cheap: "orders from last week" or "names starting with Sm" touch one or
>   two shards.
> - Easy to rebalance: split a range that grows too big into two.

> [!CONS]
> - Monotonically increasing keys (timestamps, auto-increment ids) send **every new write to
>   the last shard**.
> - Boundaries must be tuned to the data, or some ranges fill far faster than others.

```figure
hot-shard
```

## Hash partitioning
`shard = hash(key) % N`, or better, hash into many fixed slots or onto a
[consistent-hashing](#/learn/system-design/consistent-hashing) ring.

> [!PROS]
> - Spreads keys and writes evenly, even for sequential keys.
> - No boundaries to tune: the hash does the balancing.

> [!CONS]
> - **Loses ordering:** a range query on the key must ask every shard.
> - Plain `% N` moves almost every key when N changes (numbers after the traces).
> - One very hot key is still one shard: hashing can't split a celebrity.

The two traces below place the same 9 order dates, most of them from the current week, onto 3
shards. Watch `counts`.
