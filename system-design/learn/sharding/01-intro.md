# Sharding and Partitioning

> Building block · Ideas: shard key, range vs hash partitioning, rebalancing, hot partitions

Caching and read replicas help with **reads**. When **writes** or **total data size** outgrow
one machine (disk full, write IOPS maxed, indexes no longer fit in memory), the data itself has
to be split. Each **shard** (partition) holds a disjoint subset of rows and lives on its own
node, usually with its own replicas.

```
               ┌──► shard 0: users a–h   (+ replicas)
router / app ──┼──► shard 1: users i–p   (+ replicas)
 (shard map)   └──► shard 2: users q–z   (+ replicas)
```

Everything depends on the **shard key**, the column that decides where a row lives:
- Queries that include the shard key go to **one** shard, which is fast.
- Queries without it must go to **all** shards (scatter-gather), which is slow and fragile.
- A key with skewed values creates **hot shards**.

## Range partitioning
Each shard owns a contiguous key range: `[a, h)`, `[h, p)`, `[p, z]`.
- Range scans are efficient ("orders from last week", "names starting with Sm").
- Easy to split a range that grows too big.
- **Risk:** monotonically increasing keys (timestamps, auto-increment ids) send **every new
  write to the last shard**.

## Hash partitioning
`shard = hash(key) % N`, or better, hash into many fixed slots or onto a consistent-hashing ring.
- Spreads keys and writes evenly, even for sequential keys.
- **Loses ordering:** a range query must ask every shard.
- Changing N with plain `% N` moves almost everything. Use fixed slots or consistent hashing.

The two traces below place the same 9 order dates, most of them from the current week, onto 3
shards. Watch `counts`.
