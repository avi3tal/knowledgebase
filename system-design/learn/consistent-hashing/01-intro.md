# Consistent Hashing

> Building block · Ideas: hash ring, virtual nodes, minimal remapping

You have N cache or storage servers and want every key to land on exactly one of them, and you
want any client to work out which one by itself, without asking a central directory. The
obvious rule is

```
server = hash(key) % N
```

It's cheap, stateless and spreads keys evenly. Everything is fine **until N changes**: a server
dies, or autoscaling adds capacity for a traffic peak. The hash of a key never changes, but `% N` does,
so the same key now points at a different server, one that has never seen it.

```figure
mod-n-resize
```

## How bad is "most keys"?

A key stays put only when `hash % N` and `hash % (N+1)` happen to agree. For a uniform hash that
happens for about 1 key in N+1, so going from N to N+1 servers moves

```
moved fraction ≈ N / (N + 1)
```

> [!NUMBERS] Worked example: 3 → 4 servers, 10 M cached keys
> - Moved fraction ≈ 3 / 4 = **75%**, so about **7.5 M keys** now point at the wrong server.
> - For a cache: the hit rate drops from ~95% to ~25% in one step. If the cache absorbed
>   190 000 of 200 000 reads/s, the database suddenly gets **~150 000 reads/s** instead of 10 000.
> - For a storage cluster: 75% of all bytes must be copied between nodes before the new layout is
>   correct. At 10 TB that's 7.5 TB of network transfer.
> - Going 20 → 21 is no better: 20/21 ≈ 95% move. **Bigger clusters make it worse**, not better.

Removing a server is the same story: N → N−1 also changes almost every key's remainder.

> [!PITFALL] "Just rehash in the background"
> Moving 75% of the data is still moving 75% of the data. The goal isn't to hide the remap, it's
> to need a much smaller one: **only the keys that must move should move**, about K/(N+1) when a
> server joins.

What we want is a placement rule where adding or removing one server changes ownership of only
that server's share of the keys. That is exactly what the ring gives you.

Step through the naive scheme below: 8 keys, 3 servers growing to 4. Before you step, predict
how many of the 8 keys end up in `moved`.
