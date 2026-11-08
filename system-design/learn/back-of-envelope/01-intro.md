# Back-of-the-Envelope Estimation

> Fundamentals · QPS, storage, bandwidth, memory from a handful of assumptions

An estimate doesn't need to be accurate. It needs to be **right within a factor of ~10**,
because that is enough to tell one database from fifty, a hot set that fits in memory from one
that doesn't, and whether images need a CDN. Every big decision in the interview should trace
back to a number you said out loud.

## Numbers to carry in your head

> [!NUMBERS] Time and traffic
> - 1 day = 86 400 s ≈ **1e5 s**. 1 month ≈ 2.5e6 s. 1 year ≈ 3e7 s.
> - 1 M requests/day ≈ **12 /s**. 100 M/day ≈ 1 200 /s. 1 B/day ≈ 12 000 /s.
> - Units step by 1 000: KB 1e3 → MB 1e6 → GB 1e9 → TB 1e12 → PB 1e15 bytes.
> - Bandwidth is quoted in **bits**: bytes/s × 8. 1 GB/s ≈ 8 Gbps.

> [!NUMBERS] Rough single-node capacity (varies a lot, say so)
> - App server: 1k–10k simple requests/s.
> - Relational primary: ~5k–20k simple writes/s; more for reads.
> - In-memory key-value node: ~100k ops/s, tens to hundreds of GB of RAM.

**Latency.** What matters is the ratios between rungs, not the exact values:

| operation | ≈ time | relative to RAM |
|---|---|---|
| read main memory | 100 ns | 1× |
| SSD random read | 100 µs | 1 000× |
| round trip inside one data center | 0.5 ms | 5 000× |
| disk seek (spinning) | 10 ms | 100 000× |
| round trip across a continent or ocean | 100–150 ms | ~1 000 000× |

```figure
latency-ladder
```

**Availability.** Downtime = (1 − availability) × period. Each extra nine is 10× less:

| availability | per day | per 30-day month | per year |
|---|---|---|---|
| 99% | 14.4 min | 7.2 h | 3.65 days |
| 99.9% | 1.44 min | 43.2 min | 8.77 h |
| 99.99% | 8.6 s | 4.3 min | 52.6 min |
| 99.999% | 0.86 s | 26 s | 5.3 min |

Components in series multiply: two dependencies at 99.9% give at most 99.8%. The latency,
throughput and availability lesson goes deeper on budgets and SLOs.

> [!TIP]
> Memorise the bold ones. Everything else can be derived from "a day is 1e5 seconds" and
> "units step by a thousand" in a few seconds of mental math.
