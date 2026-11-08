# Fan-out on Write vs on Read

> Pattern · Ideas: push (precompute per recipient), pull (merge at read time), hybrid for big senders, async fan-out workers

Many products have the same shape: **one sender, many recipients**. A post goes to every
follower's feed, a group message to every member's inbox, a comment to everyone watching a
stream. Somewhere, one event has to turn into N deliveries. The only real choice is **when**
you pay for those N: at write time or at read time.

## Fan-out on write (push)
Precompute every recipient's result. When someone posts, workers copy the post id into each
follower's timeline. Reading is then one key lookup.

Its tabs replay a celebrity post, a worker dying mid-way, inactive followers, and the hybrid alternative.

```figure
push-flow
```

> [!PROS]
> - Reads are one lookup in a few ms, whatever the reader follows.
> - The expensive part runs asynchronously, off the request path, and can lag a few seconds.

> [!CONS]
> - One insert **per follower**, so a 40 M-follower account is a 40 M-write event.
> - Storage for every timeline, including for users who never come back.

## Fan-out on read (pull)
Write each post once. When someone opens the feed, fetch the recent posts of everyone they
follow, merge and sort.

```figure
pull-flow
```

> [!PROS]
> - Posting is one write, and big accounts cost nothing extra.
> - Always fresh, with no timelines to store or repair.

> [!CONS]
> - One query **per followee** plus a merge on every open, on the path the user waits for.
> - Read latency grows with the number of accounts followed.

## Do the arithmetic
> [!NUMBERS] The inputs
> - 200 M daily users × 10 opens a day ÷ 86 400 s ≈ **23 000 feed opens/s**.
> - 200 M × 0.5 posts a day ÷ 86 400 s ≈ **1 200 posts/s**.
> - Average 300 followers. Reads outnumber posts about **20 : 1**, which points to push.

| per second | push | pull |
|---|---|---|
| writes | 1 200 posts × 300 followers ≈ **360 000** timeline inserts (async) | 1 200 posts × 1 ≈ **1 200** |
| reads | 23 000 opens × 1 timeline ≈ **23 000** | 23 000 opens × 300 followees ≈ **6 900 000**, plus merging |
| latency the user feels | one key read, a few ms | 300 lookups and a sort, every open |

Push moves the cost to the cheaper side: writes can run **asynchronously**, through a
[queue](#/learn/system-design/message-queues) with workers, a few seconds behind. A read is the
thing the user is waiting for. Timelines are usually short capped lists of post ids (say the
latest 800) in an in-memory store, so 200 M × 800 × 8 bytes ≈ **1.3 TB**, which is fine for a
cluster.

The trace below pushes 3 posts into the timelines of a small graph. Count the writes. One
account, `star`, has more followers than everyone else put together.
