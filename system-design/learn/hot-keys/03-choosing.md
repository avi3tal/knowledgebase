## Coalescing the misses

A local cache still has a weak moment: the instant its copy expires. If 50 requests for the key
arrive during the fetch, a naive server sends 50 fetches. Coalescing (also called *single
flight*) keeps one in-flight fetch per key and lets the rest wait for it:

```figure
coalescing
```

It's cheap to add (a map of key → pending future per server) and it's the same idea as the
per-key lock that stops a [cache stampede](#/learn/system-design/caching), applied inside one
process.

## Choosing

```figure
choose-mitigation
```

- Mostly **reads** of a value that can lag a second → local cache, plus coalescing on miss.
- Mostly **reads** that must be fresh → replicate the key on several shards, and pay N writes.
- Mostly **writes** that are commutative (counts, sums, set adds) → split into sub-keys.
- Writes that must be **ordered or exact** (the current high bid, the holder of a seat) → you
  can't split. Serialise them through one partition and make that single path fast: keep the
  item's state in memory, shrink each write, batch where order allows.

> [!TIP] Make it adaptive
> Only keys the detector flags get split or cached locally. The millions of cold keys keep the
> plain path, so they don't pay N-way reads or extra memory. Detection can be a top-k sketch on
> each proxy, refreshed every few seconds.

> [!INTERVIEW] What to say
> "A live stream's reaction counter can hit 120k writes/s, more than one node handles, so for
> keys flagged hot I'll split the counter into 8 sub-keys and sum on read, caching the total for
> a second. The stream's metadata is read millions of times, so app servers keep it in a 2 s local cache
> with coalescing: the shard sees at most servers ÷ 2 reads/s."
