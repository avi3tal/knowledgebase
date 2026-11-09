## Window-based counters

**Fixed window:** keep one counter per key per calendar window (for example the minute
`12:03`) and reject once it reaches `limit`. It's the simplest option: one `INCR` with an
expiry. Its flaw shows up at the boundary.

```figure
boundary-burst
```

A client can send `2 × limit` requests in a short span by straddling the boundary.

**Sliding window log:** store the timestamp of every accepted request, drop the ones older
than `window`, and count what's left. It's exact, but memory grows with the limit, which is
expensive for a rule like "10 000 per hour".

**Sliding window counter:** keep only the counts of the **current** and **previous** fixed
windows, and estimate how many requests are in the sliding window by weighting the previous
count by how much of it still overlaps:

```text
estimate = prev_count × (window − elapsed) / window + cur_count
```

It costs two counters per key, smooths out the boundary burst, and is close enough to exact
for real traffic. Watch `estimate` in the trace below. Right after the boundary (t=11, 12) the
previous window still weighs a lot, so t=12 is rejected even though the new window has only one
request so far.

## Leaky bucket
Requests go into a FIFO queue of fixed size and **drain at a constant rate**. A full queue
means reject. The output is perfectly smooth, which suits protecting a downstream system that
can't take bursts, such as a payment provider. The cost is that bursts are delayed rather than
served, and old requests can wait in the queue.

> [!INTERVIEW] Which one should I pick?
> Say **token bucket** by default (public APIs, cheap, allows bursts), **sliding window counter**
> when the interviewer worries about boundary bursts at high limits, and **leaky bucket** when a
> downstream must see a constant rate. Then move on: the key and the counter store matter more.

| algorithm | bursts | memory per key | accuracy | typical use |
|---|---|---|---|---|
| token bucket | allowed up to capacity | 2 numbers | good | public APIs (most common) |
| leaky bucket | smoothed / queued | queue | good | constant outflow to a fragile dependency |
| fixed window | 2× at the boundary | 1 counter | rough | simple quotas (per day / per month) |
| sliding log | none | 1 timestamp per request | exact | low limits, strict rules |
| sliding counter | small | 2 counters | approximate | high limits, cheap and smooth |
