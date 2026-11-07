# Back-of-the-Envelope Estimation

> Fundamentals · QPS, storage, bandwidth, memory from a handful of assumptions

Estimates don't need to be accurate. They need to be **right to within a factor of ~10**,
because that's what tells you whether you need one database or fifty, whether the hot set fits
in memory, and whether images should come from a CDN. Every big design decision in the
interview should trace back to a number.

## The numbers to carry in your head
```
time       1 day ≈ 86 400 s ≈ 1e5 s        1 month ≈ 2.5e6 s     1 year ≈ 3e7 s
powers     thousand 1e3 = KB   million 1e6 = MB   billion 1e9 = GB   1e12 = TB   1e15 = PB
traffic    1 M requests/day ≈ 12 /s          100 M/day ≈ 1 200 /s       1 B/day ≈ 12 000 /s
latency    memory 100 ns   SSD 100 µs   same-DC round trip 0.5 ms   cross-continent 100+ ms
capacity   (ballpark, varies a lot) one app server: 1k–10k simple req/s
           one relational primary: ~5k–20k writes/s     one in-memory KV node: ~100k ops/s
```

## The recipe
1. **Write down assumptions** out loud: daily active users, actions per user, object sizes,
   retention, replication. Round them aggressively.
2. **Traffic:** per-day volume → per-second (÷ ~1e5). Do reads and writes **separately**, and
   multiply by a **peak factor** (2–3×, more for spiky events).
3. **Storage:** writes per day × object size × days retained × replicas.
4. **Bandwidth:** QPS × bytes per request (× 8 for bits per second).
5. **Memory for a cache:** the hot fraction (often ~20% of a day's reads) × object size.
6. **Conclude:** each number must end in a design consequence ("17k read QPS at peak → cache +
   replicas", "5 PB → blob store, not a DB").

Step through a photo-sharing app below: 10 M daily users, 1 in 5 posts a photo per day, each
user views 50 photos a day, 500 KB per photo, kept 5 years with 3 replicas, peak 3× average.
