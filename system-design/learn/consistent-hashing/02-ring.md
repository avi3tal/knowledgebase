## The ring

Map **both servers and keys** into the same hash space (here 0–99) and bend it into a circle. A
key belongs to the **first server you meet walking clockwise** from the key's position. Each
server therefore owns the arc that ends at it.

The tabs remove a server and show how uneven one point per server can be.

```figure
ring-lookup
```

Now add server **D**. It hashes to 65, between B (50) and C (85). Only the keys on the arc
**between D's predecessor and D**, (50, 65], change owner, and all of them move to D. Nothing
else on the ring is affected.

The tabs show the new node starting cold and how little one random point may relieve.

```figure
ring-add-node
```

Removal is the mirror image: when a server leaves, only its own keys move, all to its clockwise
neighbour. On average a membership change moves about **K / N** keys (K keys, N servers), the
minimum possible, because the newcomer has to get *its* share from somewhere.

> [!NUMBERS] Same 10 M keys, 3 → 4 servers
> - `% N`: ~75% move, **7.5 M keys**.
> - Ring: the new server takes ~1/4 of the space, **~2.5 M keys**, all from its successor.
> - At 100 servers → 101: `% N` moves 99%, the ring moves ~1%.

(The naive trace moved 5 of 8 keys, 62.5%, a little under the formula's 75%: with only 8 keys a
few lucky remainders swing the share. With millions of keys the formula is what you get.)

Watch `owner` in the trace below: only `k2` and `k5` change, compared with 5 of 8 in the
naive version above.
