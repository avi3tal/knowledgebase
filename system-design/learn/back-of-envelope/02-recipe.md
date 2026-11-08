## The recipe

```figure
estimate-recipe
```

1. **Write down assumptions** out loud: daily active users, actions per user, object sizes,
   retention, replication. Round them aggressively.
2. **Traffic:** volume per day ÷ ~1e5 = average per second. Do reads and writes **separately**,
   then multiply by a **peak factor** (2–3×, more for launches or live events).
3. **Storage:** writes per day × object size × days retained × replicas.
4. **Bandwidth:** QPS × bytes per response, × 8 for bits per second.
5. **Cache memory:** the hot fraction (often ~20% of a day's reads) × object size.
6. **Conclude:** every number ends in a consequence. "17k reads/s at peak → cache plus read
   replicas." "5 PB → object storage, not a database."

The formulas, written once:

```
avg_qps     = daily_volume / 86 400            (≈ / 1e5)
peak_qps    = avg_qps × peak_factor
storage     = writes_per_day × object_size × days × replicas
egress_bps  = read_qps × response_bytes × 8
cache_bytes = 0.2 × reads_per_day × object_size  (overestimates when reads repeat objects)
```

> [!PITFALL] Precision theatre
> Writing 86 400 to five digits while the DAU is a guess. Round to 1e5, say "about", and move
> on. The interviewer wants the order of magnitude and the conclusion, not arithmetic.

> [!INTERVIEW] How it sounds
> "Let me assume 10 million daily users, one in five uploads a photo a day, and everyone views
> about 50. That's 2 million uploads a day, roughly 23 a second: writes are easy. Views are
> 500 million a day, about 6 000 a second, maybe 17 000 at peak. That's more than one database
> should serve, so I'll plan for a cache."

Step through the full photo-sharing estimate below: 10 M daily users, 1 in 5 posts a photo per
day, each user views 50 photos a day, 500 KB per photo, kept 5 years with 3 replicas, peak 3×
the average. Each step applies one of the formulas above.
