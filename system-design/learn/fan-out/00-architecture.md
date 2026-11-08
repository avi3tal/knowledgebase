## Architecture at a glance

Before push and pull, see the system an architect would draw. This is a social network's home
timeline: authors post, millions of readers open the app, and some accounts have tens of millions
of followers. Watch how one post turns into many deliveries off the request path. Then switch the
tabs: a celebrity post, a fan-out worker crashing half-way, and an operator changing the celebrity
threshold.

```figure
system-overview
```

### Zoom in: the publish path

The author's request ends when the event is published. Everything after that is asynchronous, so
the real questions are whether an event can ever be lost and whether one huge job can block
everyone else. Watch the outbox and the planner, then try the tabs: a big author, a relay crash
and a slow timeline shard.

```figure
publish-path
```

### Zoom in: the hybrid read

The read is where the hybrid pays for skipping big authors at write time. Most of the page is
already built; the feed service only adds the few big accounts this reader follows. The tabs show
a cold timeline, a timed-out fetch that degrades the page instead of failing it, and a deleted post.

```figure
feed-merge
```

### How it scales

The design changes as the network grows. It starts as pull on read, moves to push on write, then
to a hybrid with a celebrity threshold, and finally to sharded timelines with fan-out in each
region.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| When to build timelines | on read (pull) · on write (push) · hybrid | **Hybrid** | Reads are one lookup for almost everyone, and fan-out cost is bounded by the threshold |
| Celebrity threshold | fixed count · per-author cost · none | **Follower count, tuned by config** (e.g. 500 k) | Simple to reason about; it can change without a deploy |
| What a timeline stores | full posts · post ids | **Post ids, capped at ~800** | Small entries; edits and deletes stay in one place and are applied at hydration |
| Event transport | direct calls · queue · partitioned log + outbox | **Log fed by an outbox** | No lost events between "saved" and "published"; replay and many consumers (timelines, notifications) |
| Inactive users | push to everyone · skip inactive · evict and rebuild | **Evict, rebuild on return** | Most memory goes to people who never open the app; one slow open is cheaper |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Write amplification | an account just under the threshold posts often | Workers lag and every follower's feed is late | Split posts into batches, autoscale on queue depth, lower the threshold |
| Hot read keys | millions of readers follow the same star | One cache shard saturates | Replicate big-author recents, short local caches in the feed service |
| Lost fan-out | crash between saving and publishing | A post silently never reaches followers | Transactional outbox, publish-then-mark-sent |
| Duplicate entries | a retried batch after a worker crash | The same post shown twice | Timeline entries keyed by post id, and dedup again on merge |
| Stale or deleted content | delete or block after the push | Removed posts in timelines | Tombstones checked at hydration, capped timelines that age out |
