# Redis

> Technology · Ideas: in-memory data structures, single-threaded atomic commands, TTLs, persistence, cluster slots

Redis is an **in-memory data-structure server**. Clients send short commands over TCP, and
every value lives in RAM. That gives you sub-millisecond reads and writes, but the data set is
limited by memory, and durability is something you configure, not something you get for free.

What makes it more than a [cache](#/learn/system-design/caching) is that values are **typed data
structures** with server-side operations:

| type | commands to name in an interview | real job |
|---|---|---|
| string | `GET` / `SET` / `INCR` / `SET NX PX` | cache entry, counter, lock |
| hash | `HSET` / `HGETALL` / `HINCRBY` | user session, object with fields |
| list | `LPUSH` / `LTRIM` / `LRANGE` | last 50 comments, small work queue |
| set | `SADD` / `SISMEMBER` | who is online, dedup of ids |
| sorted set | `ZADD` / `ZINCRBY` / `ZREVRANGE` | leaderboard, waiting room, time index |
| geo | `GEOADD` / `GEOSEARCH` | drivers near a point |
| pub/sub | `PUBLISH` / `SUBSCRIBE` | fan a message out to connected servers |
| stream | `XADD` / `XREADGROUP` | lightweight log with consumer groups |

> [!TIP] Lead with the structure, not the product
> "Leaderboard → sorted set, `ZINCRBY` on every score, `ZREVRANGE 0 9` for the top 10" says much
> more than "we'll use Redis".

## Why the commands are safe without locks

```figure
event-loop
```

Commands execute one after another on a single thread, so `INCR` or `ZINCRBY` is atomic: two
clients can't both read 7 and write 8. You get counters and rankings **without a
read-modify-write in your application**, and multi-step logic can run atomically as a Lua script.

> [!PROS]
> - Atomic counters, sets and rankings with no locks in your code.
> - Predictable latency: no lock contention, no query planner.

> [!CONS]
> - One slow command stalls everyone. `KEYS *`, or `HGETALL` on a 1 M-field hash, freezes the loop
>   for every client.
> - One node uses about one core for commands, so you scale out with more nodes, not bigger ones.

## Numbers to quote

> [!NUMBERS] Back-of-envelope
> - **~100 000 ops/s per node** for simple commands, more with pipelining; latency
>   **~0.2–1 ms** over the network.
> - Sorted set: ~**100 bytes** per member including overhead, so 1 M players ≈ **100 MB** and
>   10 M ≈ **1 GB**.
> - A node usually has **25–100 GB** of RAM. Size as keys × bytes per key, then add ~2× headroom
>   for fragmentation and snapshot forks.
> - `ZINCRBY`, `ZREVRANK` are **O(log n)**: about 24 steps for 10 M members.

The trace below keeps a leaderboard in a sorted set. Each `ZINCRBY` moves the player to its new
rank immediately, so reading the top 3 is just a slice off the front.
