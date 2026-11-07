# Reference walkthrough: LRU cache (object-oriented)

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Requirements
`get` and `put` in **O(1)**, a **fixed capacity**, and **evict the least recently used** entry when
full. What turns this from a LeetCode exercise into a design question: the rule will change
(**LFU, TTL**), callers want **stats and eviction callbacks**, and it is called from **dozens of
threads**, mostly reads.

## 2. Core objects
A hash map `key → Node` finds entries; a **doubly linked list** of `Node(key, value, prev, next)`
keeps recency order (head = newest). Sentinel head and tail nodes remove the edge cases. The node
stores its key so that popping the tail can also delete it from the map.

## 3. Class diagram
- **v1**: one `LRUCache` with a dict and a `DoublyLinkedList`. Correct and O(1), but callers
  import the concrete class, the LRU rule is welded in, and it is not thread-safe.
- **v2**: callers depend on a small **`Cache` interface**. The "who leaves next" rule moves into an
  **`EvictionPolicy`** (`LRUPolicy` owns the map + list; `LFUPolicy` can follow), so `LRUCache`
  is really a bounded cache configured with LRU by default. Concurrency and stats are added
  *around* any cache: `SegmentedCache` (lock striping), `ThreadSafeCache` and `StatsCache`
  (decorators), plus an `EvictionListener` for callbacks.

## 4. Key patterns and why
- **Program to an interface** (`Cache`): swapping LRU for LFU, or adding thread safety, never
  touches callers.
- **Strategy** (`EvictionPolicy`): the policy gets `on_access`, `on_insert`, `on_remove` and
  answers `victim()`. TTL becomes an expiry check on `get` plus a policy.
- **Decorator** for cross-cutting concerns: stats and locking wrap any `Cache` instead of
  cluttering the core (single responsibility).

## 5. Thread safety (deep dive)
The trap: **`get` is a write**, because it moves the node to the front. So a read-write lock buys
nothing; all calls would take the write lock.
- **One global mutex** (`ThreadSafeCache`): simple and exact, but every call serialises; with 30
  threads the lock is the bottleneck.
- **Lock striping** (`SegmentedCache`): split the key space into N segments by `hash(key) % N`,
  each a small `LRUCache` with its own lock and capacity/N. Contention drops about N×. The cost:
  LRU becomes per segment (approximate globally), which is almost always acceptable.
- Advanced: buffer recency updates and apply them in batches so reads are lock-free (what
  high-performance caches do); mention it, don't build it.
- **Callbacks run outside the lock**, otherwise user code in `on_evict` can deadlock or stall the
  cache.

## 6. Extensibility
New eviction rules are new policies; stats, logging and metrics are decorators; size by bytes
means a weigher function instead of an entry count; a distributed tier can sit behind the same
`Cache` interface.

## Transferable pattern
**Composite structure behind a narrow interface:** map (find) + ordered structure (who goes next),
hidden behind a small interface, with the rule in a policy and cross-cutting concerns as wrappers
or striped segments. The same shape fits rate limiters, connection pools and in-memory session
stores.
