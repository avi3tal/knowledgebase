# Fan-out on Write vs on Read

> Pattern · Ideas: push (precompute per recipient), pull (merge at read time), hybrid for big senders, async fan-out workers

Many products have the same shape: **one sender, many recipients**. A post goes to every
follower's feed, a group message to every member's inbox, a comment to everyone watching a
stream. Somewhere, one event has to turn into N deliveries. The only real choice is **when**
you pay for those N: at write time or at read time.

```
fan-out on WRITE (push)                      fan-out on READ (pull)

post ─► workers ─┬─► timeline:bob  [p9, …]   post ─► posts:ann [p9, …]   (one write)
                 ├─► timeline:cat  [p9, …]
                 └─► timeline:dan  [p9, …]   open feed (bob) ─► read posts of each followee
open feed (bob) ─► read timeline:bob            ann, star, eve, … ─► merge + sort ─► top 20
```

- **Push** precomputes every recipient's result. Reading is one key lookup, so feeds load in a
  few ms. Writing costs one insert **per follower**.
- **Pull** writes each post once. Reading costs one query **per followee**, then a merge and a
  sort, on every open.

## Do the arithmetic
Take 200 M daily users who open the feed 10× a day and post every other day: about
**23 000 feed opens/s** against **~1 200 posts/s**. Reads win by ~20:1, which points to push.

```
push:  1 200 posts/s × 300 followers  ≈ 360 000 timeline inserts/s   (spread over workers)
       23 000 opens/s × 1 read        ≈  23 000 reads/s
pull:  1 200 posts/s × 1 write        ≈   1 200 writes/s
       23 000 opens/s × 300 followees ≈ 6 900 000 reads/s, plus merging
```

Push moves the cost to the cheaper side: writes can run **asynchronously**, through a
[queue](#/learn/system-design/message-queues) with workers, a few seconds behind. A read is the
thing the user is waiting for. Timelines are usually short capped lists of post ids (say the
latest 800) in an in-memory store, so 200 M × 800 × 8 bytes ≈ **1.3 TB**, which is fine for a
cluster.

The trace below pushes 3 posts into the timelines of a small graph. Count the writes. One
account, `star`, has more followers than everyone else put together.
