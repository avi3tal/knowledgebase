# Concurrency in low-level design

> Fundamentals · locks, condition variables, producer/consumer, thread-safe classes

In an OOD round the follow-up after "draw the classes" is often: **"Now two users do this at the
same time. What breaks?"** You aren't expected to write a lock-free queue. You are expected to:

1. Name the **shared mutable state** (the seat map, the stock count, the next free id).
2. Name the **invariant** that must hold ("a seat is booked by at most one user", "stock ≥ 0").
3. Choose the **smallest critical section** that protects it, and say where the lock lives.
4. Say what happens to callers that must **wait** (block, fail fast, retry, queue).

## The core bug: read-modify-write

`count += 1` looks like one step, but it's three: **read** the value, **add**, **write** it back.
If two threads interleave between the read and the write, one increment disappears.

```
time →   A: read 0          A: write 1
         B:       read 0               B: write 1      counter = 1, expected 2
```

The trace below replays exactly that schedule (`A, B, A, B`). Watch both private copies hold
`0` and the second write overwrite the first. The lesson's checks also run the same schedule
with `use_lock: true`: B blocks at `acquire` until A releases, and the result is 2.

**Visual note:** the studio has no multi-thread timeline view yet, so the threads appear as
two entries in the `seen` and `pc` maps.
