## Modelling: query first, then denormalise
In a relational schema you model entities and write any query later. Here you list the queries
first and build one table per access pattern, copying data where needed:

| query | table | partition key | clustering key |
|---|---|---|---|
| messages of a chat, newest first | `messages_by_conversation` | conversation_id | seq DESC |
| a user's followers | `followers_by_user` | user_id | follower_id |
| comments on a video in the last hour | `comments_by_video_hour` | (video_id, hour) | comment_id |

Two rules keep partitions healthy:
- **Bound them.** Aim for under ~100 MB and ~100k rows per partition. A chat that runs for years
  or a celebrity's follower list grows without limit, so add a **time bucket** to the partition key,
  `(video_id, hour)`, to cap each one.
- **Spread them.** A partition lives on just RF nodes (usually 3). One hot key can't be split,
  so a viral video hammers three machines while the rest idle.

## Tunable consistency
Each partition is copied to **N** replicas (the replication factor). Every request picks how many
replicas must answer:
```
           write W of N                read R of N
 client ─► coordinator ─► r0 r1 r2     client ─► coordinator ─► r0 r1 r2
           ack after W confirm                   newest timestamp wins
```
- **R + W > N** (e.g. N=3, QUORUM writes W=2 and QUORUM reads R=2): every read set overlaps every
  write set, so a read sees the latest acknowledged write.
- **W=1, R=1:** fastest and still available with two replicas down, but a read can miss a write
  that hasn't spread yet. Hints, read repair and anti-entropy repair make replicas **converge**
  later, so the data is eventually consistent.

Conflicts are settled by **last write wins** on per-cell timestamps, so clock skew can silently
drop an update. If you need compare-and-set, lightweight transactions (Paxos) exist, but they cost
about 4 round trips. Use them rarely.

The trace runs N=3 with W=1 and R=1. Writes land on replica 0 and reads ask replica 2, so the sets
never overlap and every read is stale. The checks rerun it: with W=2, R=2 or W=1, R=3 the stale
count drops to 0, but W=2, R=1 (R + W = N) still misses every write.
