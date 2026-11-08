## The celebrity problem and the hybrid

Push breaks on the long tail of follower counts. When an account with **40 M followers** posts,
push means 40 M inserts for a single event. At 100 000 inserts/s per worker pool that's
**~7 minutes** before the last follower sees it, and the queue backs up behind it for everyone
else. A few thousand such accounts posting a few times a day can cost more than all normal
users together.

The hybrid splits senders by a **follower threshold** (e.g. 10 000–100 000):

```
normal author (300 followers)  ─► push into 300 timelines
big author   (40 M followers)  ─► write once to posts:star          (no fan-out)

open feed (bob):
   timeline:bob  ──────────────────────┐
   posts of the big accounts bob follows ─┴─► merge by time ─► page of 20
```

Each reader follows only a handful of big accounts, so the read-time merge adds a few lookups,
not 300. Those big accounts' recent posts are the hottest keys in the system, so they sit in a
[cache](#/learn/system-design/caching), replicated across nodes
([hot keys](#/topic/system-design/hot-keys)).

Run the same graph through the hybrid below with `threshold = 3`. Writes drop from 9 to 5, reads rise
from 3 to 6, and the three readers still get the same 5 posts between them. A huge threshold is pure push, 0 is pure
pull.

## Other knobs
- **Only push to active users.** Someone who hasn't opened the app in 30 days doesn't need a
  timeline kept warm. Rebuild it with pull when they come back.
- **Store ids, not posts.** Timelines hold post ids, and the post bodies are fetched in one batch
  read. An edit or delete then needs no fan-out, only a filter at read time.
- **Fan-out is async and idempotent.** Workers read a post event from a log, page through the
  follower list in batches of ~1 000 and insert. A retried batch must not duplicate entries
  (timelines keyed by post id).
- **Small groups are easy.** A 200-member chat group is a bounded fan-out: push to every
  member's inbox or connection without a second thought.
- **Not only feeds.** The same choice shows up for notifications, group chat, live comments and
  splitting one upload into many processing jobs.
