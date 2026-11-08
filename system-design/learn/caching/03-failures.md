## TTL as a safety net

Even with invalidation, give every entry a TTL. It bounds how long any missed invalidation or
race can serve wrong data. Choose the TTL from **how stale the product can tolerate**, not
from memory size: seconds for prices, hours for avatars.

> [!TIP] Jitter your TTLs
> If you warm 100 000 keys at the same moment with `EX 300`, they all expire at the same moment
> too. Use `300 ± 10%` so expiries spread out.

## Failure modes to name in an interview

### Cache stampede (thundering herd)

A popular key expires, and every request that arrives before it is rebuilt misses at once.

```figure
stampede
```

> [!NUMBERS] Why it hurts
> A key read 10 000 times/s with a 50 ms rebuild sends **~500 identical queries** to the
> database before the first one finishes, and a slow, overloaded database makes the window
> longer, so it gets worse.

Fixes, usually combined:
- **Per-key lock** (`SET lock:key NX PX …`): one request rebuilds, the others wait briefly or
  retry.
- **Stale-while-revalidate:** keep serving the old value while one background refresh runs.
- **Early refresh:** recompute hot keys a little before they expire.
- **Jittered TTLs**, so related keys don't expire together.

### Other failure modes

| problem | what happens | fix |
|---|---|---|
| **hot key** | one key's traffic melts its single cache shard | replicate the key (`key#1..#n`) or cache it in-process too; see [hot keys](#/learn/system-design/hot-keys) |
| **cold start** | a new or flushed cache sends everything to the database | warm the hot set first, ramp traffic gradually |
| **penetration** | lookups for keys that **don't exist** always miss | cache the "not found" briefly, or check a Bloom filter first |
| **cache down** | the whole read load lands on the database | replicas for the cache tier, and a database sized (or rate-limited) to survive it |

> [!INTERVIEW] The one-liner that shows depth
> "When a hot key expires I don't want 10 000 requests rebuilding it, so I'll use a per-key lock
> with stale-while-revalidate, and jitter the TTLs."
