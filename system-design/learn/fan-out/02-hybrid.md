## The celebrity problem and the hybrid

Push breaks on the long tail of follower counts. When an account with **40 M followers** posts,
push means 40 M inserts for a single event. At 100 000 inserts/s per worker pool that's
**~7 minutes** before the last follower sees it, and the queue backs up behind it for everyone
else. A few thousand such accounts posting a few times a day can cost more than all normal
users together.

The hybrid splits senders by a **follower threshold** (e.g. 10 000–100 000):

```figure
hybrid-decision
```

On the read side, the feed service merges the reader's precomputed timeline with the recent
posts of the few big accounts they follow:

```figure
hybrid-read
```

Each reader follows only a handful of big accounts, so the read-time merge adds a few lookups,
not 300. Those big accounts' recent posts are the hottest keys in the system, so they sit in a
[cache](#/learn/system-design/caching), replicated across nodes
([hot keys](#/topic/system-design/hot-keys)).

| | write cost per post | read cost per open | freshness | weak spot |
|---|---|---|---|---|
| **push** | one insert per follower | 1 lookup | seconds behind | celebrities, inactive users |
| **pull** | 1 write | one query per followee | always fresh | heavy readers, slow feeds |
| **hybrid** | push below the threshold, 1 write above | 1 lookup + one per big followee | seconds behind, big accounts fresh | two code paths, choosing the threshold |

> [!INTERVIEW] Bringing up the hybrid
> "Push works for almost everyone: 300 followers means 300 async inserts. But follower counts
> are skewed, and a 40 M-follower account would mean 7 minutes of fan-out per post. So
> accounts above about 100 000 followers aren't fanned out. Their recent posts live in a
> replicated cache, and each reader merges in the few they follow at read time."

## Other knobs
- **Only push to active users.** Someone who hasn't opened the app in 30 days doesn't need a
  timeline kept warm. Rebuild it with pull when they come back.
- **Store ids, not posts.** Timelines hold post ids, and the post bodies are fetched in one batch
  read. An edit or delete then needs no fan-out, only a filter at read time.
- **Fan-out is async and idempotent.** Workers read a post event from a log, page through the
  follower list in batches of ~1 000 and insert. A retried batch must not duplicate entries
  (timelines keyed by post id).

```figure
fanout-worker
```
- **Small groups are easy.** A 200-member chat group is a bounded fan-out: push to every
  member's inbox or connection without a second thought.
- **Not only feeds.** The same choice shows up for notifications, group chat, live comments and
  splitting one upload into many processing jobs.

Run the same graph through the hybrid below with `threshold = 3`. Writes drop from 9 to 5, reads rise
from 3 to 6, and the three readers still get the same 5 posts between them. A huge threshold is pure push, 0 is pure
pull.
