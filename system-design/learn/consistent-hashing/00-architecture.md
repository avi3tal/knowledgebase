## Architecture at a glance

Before the ring itself, see the system an architect would draw. This is an online store whose
product pages read from a cache tier in front of the catalog database. The app servers carry the
ring in memory and pick the cache node themselves. Play the figure, then switch the tabs: a node
added for a sale, a node that crashes, and a ring change that reaches the servers unevenly.

```figure
system-overview
```

### Zoom in: a node joins the ring

The interesting moments are membership changes. Watch how little moves when Cache D joins:
one miss per key on D's new arcs, and nothing else. The tabs show a warm-up alternative that
avoids even those misses, a graceful leave, and a node that dies halfway through joining.

```figure
cache-node-join
```

### Zoom in: placing virtual nodes

Before any app server sees a new ring, membership decides how many tokens each node gets and
checks that the shares come out even. Try the tabs for a bigger machine, a removed node, and
what happens when someone sets the token count too low.

```figure
vnode-placement
```

### How it scales

The design changes as the tier grows: modulo hashing, then a ring, then virtual nodes, then
replicas in different zones so a whole zone can fail without emptying the cache.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Where the ring lives | client library · routing proxy · server-side redirect | **Client library** in every app server | No extra hop on the request path, and no proxy tier to scale |
| Key → node mapping | hash % N · ring · rendezvous · jump hash | **Ring with virtual nodes** | Moves about 1/N of the keys per change, supports weights, and failures spread out |
| Tokens per node | 1 · a few · 100–256 | **128 × weight** | Shares stay close to even; the ring is still only a few thousand entries |
| Source of membership | static config file · coordination service · gossip | **Coordination service** with a versioned ring | Every server converges on the same ring quickly, and the version can be checked |
| Removing a dead node | immediately · after N failed health checks | **After 3 checks** (about 15 s) | A brief network blip doesn't reshuffle keys twice |
| Copies per key | 1 · 2 in different zones | **1 at first, 2 when a cold cache hurts the DB** | Replication doubles memory; buy it when misses are what takes the DB down |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Miss burst | a node joins, leaves or crashes | DB load jumps for its share of keys | Coalesce concurrent misses, warm new nodes, add capacity before the peak |
| Split view of the ring | a push reaches some app servers late | Stale reads, invalidations sent to the wrong node | Version the ring, alert on mixed versions, invalidate on old and new owners |
| Uneven shares | too few tokens, or mismatched machines | One node is hot and evicts early | 100+ tokens per node, weights by size, check shares before publishing |
| Hot key | one product is on every home page | One node saturates; the ring can't spread one key | Small local cache in each app server, or copy that key to several nodes |
| Flapping node | node goes up and down repeatedly | Keys move back and forth, misses each time | Hysteresis on health checks, and only re-add a node after it has been stable for a while |
