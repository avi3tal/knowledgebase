## TTL: data that cleans itself up

Any key can carry an expiry (`EXPIRE key 60`, or `SET key v EX 60`), and Redis deletes it on its
own. Expiry is lazy (checked when the key is touched) plus a background sweep, so memory comes
back without a cleanup job. Many real uses depend on it:

| use | commands | what the TTL does |
|---|---|---|
| **counter per window** | `INCR hits:{user}:{minute}`, `EXPIRE` on the first hit | old windows vanish, no cleanup job |
| **session / presence** | heartbeat `SET online:{dev} 1 EX 60` | a silent device disappears within 60 s |
| **lease / lock** | `SET lock:{id} owner NX PX 30000` | a crashed holder can't block forever |
| **short holds** | `SET hold:{seat} user NX EX 600` | an unpaid seat goes back on sale |

The lease pattern shows why the TTL is the point, not an extra:

The tabs show where a lease alone breaks (an expiry mid-work, an unsafe release) and the fencing-token fix.

```figure
lock-lease
```

> [!PITFALL] A TTL lease isn't a correct lock on its own
> If worker 1 isn't dead but just paused (a long GC, a slow disk) for more than 30 s, it wakes up
> believing it still holds the lock while worker 2 also does. Use a **fencing token** that the
> protected resource checks. That's the
> [distributed locking](#/topic/system-design/distributed-locking) topic.

> [!INTERVIEW] What to say about a Redis lock
> "`SET NX PX` with a TTL a bit longer than the job, a random owner value so only the owner
> deletes it, and a fencing token if correctness matters more than efficiency."

The trace below counts requests per user with `INCR` (limit 3 per 10 s). The TTL starts on the
first hit, and once it passes the key is gone and the count starts again at 1.
