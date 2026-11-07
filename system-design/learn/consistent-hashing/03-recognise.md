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

**Alternatives worth naming:**
- **Fixed number of partitions** (e.g. 1 024 slots) mapped to nodes through a small table.
  You move whole slots when nodes change. This is popular in databases and caches because the
  mapping is explicit and easy to rebalance.
- **Rendezvous (highest-random-weight) hashing:** score every node per key and pick the max.
  There's no ring, and it moves the same minimal number of keys, but each lookup is O(N).

**Interview pitfalls:**
- Saying "consistent hashing" without explaining **why** (`% N` remaps almost everything).
- Forgetting virtual nodes, so load is uneven and a failure cascades to one neighbour.
- Ignoring hot keys: the ring balances **keys**, not **traffic**. One celebrity key still hits
  one node. You need replication of that key or a cache in front.
- Claiming zero data movement. About K/N keys still move and must be copied or warmed.
