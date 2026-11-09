## Worked example in brief: a game leaderboard

> "Design the global leaderboard for a mobile game."

**1. Scope.** Functional: submit a score, see the top 100, see my own rank. Out of scope:
friends-only boards and anti-cheat. Non-functional: ranks update within seconds, reads under
100 ms. Numbers:

```text
writes  = 5 M DAU × 10 games / 86 400 s ≈ 600 /s
reads   ≈ 3 × writes                    ≈ 1 800 /s
storage = 5 M players × ~50 B           ≈ 250 MB   (fits in memory on one node)
```

**2. High level.** API: `POST /scores {player, score}`, `GET /leaderboard/top?n=100`,
`GET /leaderboard/rank/{player}`. Data: `scores(player_id, best_score, updated_at)`. v1 is the
obvious design, and it has a flaw you can name:

```figure
leaderboard-v1
```

Decompose into two parts: **rank reads** (needs O(log n) rank) and **score ingest** (durable
writes that feed the ranking). Solve each, merge them on the shared API node:

The tabs show the sorted set being lost, a tournament-end burst, and a simpler dual-write alternative.

```figure
leaderboard-v2
```

**3. Deep dives.** (a) Keeping the sorted set and the DB in sync. Option one, write both in the
request: simple, but a failure between the two writes leaves them disagreeing. Option two, write
the DB and update the set from a queue. Choose the queue, because seconds of lag are allowed and
the DB stays the source of truth. (b) Too many players for one memory node: shard the sorted set
by score range, and approximate ranks in the long tail.

**4. Wrap-up.** First bottleneck: the single sorted-set node. Failure: rebuild it from the DB.
Monitor queue lag and p99 rank latency. Next: daily and weekly boards with expiry.

## How the practice console maps to the framework

The kb console splits the four steps into seven stages and checks each one against a rubric:

| framework step | console stage | what you fill in |
|---|---|---|
| 1 Scope | **scope** | functional, non-functional, assumptions, out of scope |
| 1 Scope (numbers) | **estimates** | rows of `name / formula / unit`, evaluated like a calculator |
| 2 High level | **api** | endpoints (method, path, request, response) and data entities with a store |
| 2 High level (decompose) | **parts** | one part per hard requirement: options, `choice`, `why`, a small sub-diagram |
| 2 High level (reduce) | **high-level** | diagram versions v1 → vN, parts merged by node id; **every version needs a `why`** |
| 3 Deep dive | **deep-dives** | options with pros/cons, then a `choice` **and** a `why` |
| 4 Wrap-up | **wrap-up** | bottlenecks, failures, monitoring, scale, future |

What the console rewards is what an interviewer rewards:

- **Evolving the design:** v1 is simple and each later version fixes a named flaw.
- **Parts that land in the final diagram:** a part whose nodes never reach the high-level design
  is flagged.
- **No smells:** a client talking straight to a database, boxes connected to nothing, a queue
  nobody consumes, or a read-heavy problem with a single store and no cache or replica.
- **Decisions with reasons:** a part or deep dive with no `choice` or `why` doesn't count.
- **Tips are a ladder:** ask for a *nudge*, then a *hint*, and use *show* only when truly stuck.

The check labels say *what* a good answer covers ("read path can absorb the read load"), never
the answer itself. Treat them as the interviewer's unspoken checklist.
