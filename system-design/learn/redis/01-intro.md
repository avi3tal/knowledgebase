# Redis

> Technology · Ideas: in-memory data structures, single-threaded atomic commands, TTLs, persistence, cluster slots

Redis is an **in-memory data-structure server**. Clients send short commands over TCP, and
every value lives in RAM. That gives you sub-millisecond reads and writes, but the data set is
limited by memory, and durability is something you configure, not something you get for free.

What makes it more than a [cache](#/learn/system-design/caching) is that values are **typed data
structures** with server-side operations:

```
type          commands you'd say in an interview     real job
string        GET / SET / INCR / SET NX PX           cache entry, counter, lock
hash          HSET / HGETALL / HINCRBY               user session, object with fields
list          LPUSH / LTRIM / LRANGE                 last 50 comments, small work queue
set           SADD / SISMEMBER                       who is online, dedup of ids
sorted set    ZADD / ZINCRBY / ZREVRANGE             leaderboard, waiting room, time index
geo           GEOADD / GEOSEARCH                     drivers near a point
pub/sub       PUBLISH / SUBSCRIBE                    fan a message to connected servers
stream        XADD / XREADGROUP                      light-weight log with consumer groups
```

## Why the commands are safe without locks
```
clients ──► ┌──────────────────────────────┐
clients ──► │ one event loop, one command   │──► RAM (dict of key → structure)
clients ──► │ at a time, start to finish    │      └─► AOF / RDB snapshot to disk
            └──────────────────────────────┘
```
Commands execute one after another on a single thread, so `INCR` or `ZINCRBY` is atomic: two
clients can't both read 7 and write 8. You get counters and rankings **without a
read-modify-write in your application**, and multi-step logic can run atomically as a Lua script.

## Numbers to quote
- **~100 000 ops/s per node** for simple commands, more with pipelining; latency **~0.2–1 ms**
  over the network.
- Memory is the limit: a 1 M-member sorted set of short ids is roughly **100 MB**. A node usually
  has 25–100 GB of RAM.
- Big or slow commands block everyone: `KEYS *`, or `HGETALL` on a 1 M-field hash, stalls the
  loop for every client.

The trace below keeps a leaderboard in a sorted set. Each `ZINCRBY` moves the player to its new
rank immediately, so reading the top 3 is just a slice off the front.
