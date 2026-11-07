# Design a distributed key-value store

> Difficulty: **hard** · Topics: key-value store, consistent hashing, replication, CAP and consistency · ~60 min

Build the storage layer your company's services use for simple data: shopping carts, session
state, user settings, feature data. The interface is tiny (put a value under a key, get it back,
delete it), but the data is far too big for one machine and the machines fail all the time.

## What the interviewer tells you if you ask
- About **20 billion keys**. Keys are at most 256 bytes; values average **~1 KB** (max 1 MB).
- Peak load is about **1 million reads/s** and **200,000 writes/s**.
- Target latency: **p99 under 10 ms** for both reads and writes inside one region.
- Each storage server has **4 TB** of usable disk. Ops wants disks kept **at most half full** to
  leave room for rebalancing and compaction.
- One region with **three availability zones**. With this many servers, **some machine is down
  every week**; a whole zone can be cut off occasionally.
- The main customer (the cart team) says: "Never refuse a write. If two versions of a cart show
  up, give us both and we'll merge them." Other teams want an option for stronger reads.
- Capacity grows ~50% a year; adding servers must not require downtime.

## Your job
Work through the stages in the console: scope → estimates → API & data → high-level design
(evolve it: v1 → v2 → v3) → deep dives with trade-offs → wrap-up. Use the checklist on the right
and ask for tips when stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Which servers own a given key, and how much data moves when you add a server?
- How many copies, and how many must answer before a read or write counts as done?
- Two clients write the same key on different sides of a network split. What does a later read
  return?
- How does the cluster notice a dead server, and how does a replica that missed writes catch up?
