## Alternatives worth naming

The ring isn't the only way to get "small remap on resize". Interviewers like hearing that you
know the neighbours:

| scheme | lookup | moved on +1 node | balance | used when |
|---|---|---|---|---|
| `hash % N` | O(1), stateless | ~N/(N+1) of keys | even | N never changes |
| ring + virtual nodes | O(log(N·V)) binary search | ~K/N, from many peers | even with V ≈ 100+ | client-side routing, leaderless KV stores, cache clients |
| fixed slots (e.g. 16 384) + table | O(1) via slot map | whole slots you choose to move | as even as you assign | databases and caches that want explicit, operator-controlled rebalancing |
| rendezvous (highest random weight) | O(N): score every node | ~K/N | even | small N, no ring to maintain |

> [!TIP] Fixed slots are the same idea, made explicit
> `slot = hash(key) % 16384` never changes, because the slot count never changes. Only the small
> slot → node table changes, and you move whole slots on purpose. That's how
> [Redis Cluster](#/learn/system-design/redis) shards. Say it if the interviewer asks "what does
> a real system do?".

## How to recognise you need it

**Strong signals:**
- A **distributed cache** or **key-value store** whose node count changes: autoscaling, node
  failures, adding capacity.
- "Adding a node shouldn't invalidate the whole cache" / "minimise data movement".
- Client-side or proxy-side routing with **no central lookup table**.
- Sticky routing of a key (user, session, partition) to the same worker even as workers come and
  go.

**Look-alikes, and why they're different:**
- **Sharding** is the broader decision to split data into partitions, by range or by hash.
  Consistent hashing is **one way to place** hash partitions on nodes so rebalancing is cheap.
  If the question is "how do I split the data at all / which shard key", it's sharding.
- **Load balancing** spreads **stateless** requests: any server can serve any request, so plain
  round robin is fine. Consistent hashing matters when the request must reach the server that
  **holds the data** for that key.
- **Replication** copies the **same** data to several nodes for availability. The ring only
  decides *which* nodes, and the copying itself is replication.

> [!PITFALL] Interview pitfalls
> - Saying "consistent hashing" without explaining **why**: `% N` remaps almost every key.
> - Forgetting virtual nodes, so load is uneven and a failure cascades onto one neighbour.
> - Ignoring hot keys: the ring balances **keys**, not **traffic**. One celebrity key still hits
>   one node, and you need [hot-key](#/learn/system-design/hot-keys) techniques for it.
> - Claiming zero data movement. About K/N keys still move and must be copied or re-warmed.
