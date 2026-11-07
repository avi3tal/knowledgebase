## Worked example in brief: a game leaderboard

> "Design the global leaderboard for a mobile game."

**1. Scope.** Functional: submit a score, see the top 100, see my own rank. Out of scope:
friends-only boards, anti-cheat. Non-functional: rank updates within seconds, reads under
100 ms. Numbers: 5 M DAU, 10 games each → about 50 M score updates/day ≈ 600 writes/s, and
maybe 3× that in reads.

**2. High level.** API: `POST /scores {player, score}`, `GET /leaderboard/top?n=100`,
`GET /leaderboard/rank/{player}`. Data: `scores(player_id, best_score, updated_at)`.
- v1: client → game service → SQL database, `ORDER BY score DESC`. That's correct, but "rank of
  player X" scans millions of rows.
- v2: add an in-memory **sorted set** keyed by score for O(log n) rank and top-n, with the
  database kept as the durable source.

**3. Deep dives.** (a) Keeping the sorted set and the DB in sync: write both, or write the DB and
update the sorted set asynchronously via a queue. Choose async, because a few seconds of lag
is allowed. (b) More players than one memory node can hold: shard by score range, and approximate
ranks for the long tail.

**4. Wrap-up.** Bottleneck: a single sorted-set node. Failure: rebuild it from the DB.
Monitor update lag and p99 rank latency. Future: daily and weekly boards with TTLs.

## How the practice console maps to the framework
The kb console splits the four steps into six stages and checks each against a rubric:

| framework step | console stage | what you fill in |
|---|---|---|
| 1 Scope | **scope** | functional, non-functional, assumptions, out of scope |
| 1 Scope (numbers) | **estimates** | rows of `name / formula / unit`, evaluated like a calculator |
| 2 High level | **api** | endpoints (method, path, request, response) and data entities with a store |
| 2 High level | **high-level** | diagram versions v1 → vN; **every version needs a `why`** |
| 3 Deep dive | **deep-dives** | options with pros/cons, then a `choice` **and** a `why` |
| 4 Wrap-up | **wrap-up** | bottlenecks, failures, monitoring, scale, future |

Things the console rewards, which are exactly what an interviewer rewards:
- **Evolving the design.** Don't draw the final architecture first. v1 is simple, and each
  later version fixes a named flaw.
- **No smells in the final diagram:** clients talking straight to a database, boxes connected
  to nothing, a queue nobody consumes, a service no client can reach, or (when the problem is
  read-heavy) a single store on the read path with no cache or replica.
- **Decisions with reasons.** A deep dive with no `choice` or `why` doesn't count.
- **Tips are a ladder.** Ask for a *nudge* first, then a *hint*. Use *show* only when truly
  stuck, the way you'd ask an interviewer for a hint without giving up.

The check labels describe *what* a good answer covers ("read path can absorb the read load"),
never the answer itself. Treat them like the interviewer's unspoken checklist.
