## The ring

Map **both servers and keys** into the same hash space and bend it into a circle. A key belongs
to the **first server you meet walking clockwise** from the key's position.

```
ring unrolled (positions 0..99; walking past 99 wraps back to 0)

0                                                                       99
|-k3(8)-k1(17)-[A 20]-k6(25)-k8(36)-[B 50]-k2(58)-k5(63)-k7(74)-[C 85]-k4(91)-|
   └─────────► A        └──► B          └─────────► C              └──► wraps to A

D joins at 65:
|-k3(8)-k1(17)-[A 20]-k6(25)-k8(36)-[B 50]-k2(58)-k5(63)-[D 65]-k7(74)-[C 85]-k4(91)-|
                                           └──► D now          (everything else unchanged)
```

When server **D** joins at position 65, only the keys on the arc **between D's predecessor (B at
50) and D** change owner, and all of them move to D. Every other key stays put. When a server
leaves, only its own keys move, to its clockwise neighbour. On average a change moves just
**K/N** keys (K keys, N servers).

Watch `owner` in the trace below: only `k2` and `k5` change, compared with 5 of 8 in the
naive version above.

## Virtual nodes
With only a few real points on the ring, the arcs are uneven. One server can own 50% of the
ring while another owns 10%. And when a server dies, **all** its load lands on one neighbour.

The fix is to give each physical server many points (**virtual nodes**, e.g. 100–200 each),
`hash("A#1")`, `hash("A#2")`, …:
- Arc sizes average out, so load is even.
- A dead server's keys scatter across **many** neighbours instead of one.
- Stronger machines get more virtual nodes (weighting).

The cost is a bigger ring to keep in memory (still tiny) and a lookup that is a binary
search over sorted positions, `O(log(N·V))`.

## Replication on the ring
To keep R copies, store a key on the first **R distinct physical servers** clockwise. Skip
virtual nodes of a server you already picked. That ordered list is the key's *preference
list*, as used by leaderless key-value stores.
