## Architecture at a glance

Before push and pull, see the system an architect would draw. This is the "watch" inbox of a
code-hosting platform: a push, an issue or a release on a repository must show up in the inbox of
everyone watching that repository. Most repositories have a few watchers, a handful have hundreds
of thousands. Watch how one saved event becomes many inbox entries off the request path, and how a
second consumer (the email digest) reads the same log. Then switch the tabs: a release on a very
popular repo, a fan-out worker dying half-way, and an operator lowering the watcher threshold.

```figure
system-overview
```

### Zoom in: the publish and fan-out path

The developer's request is finished once the event and its outbox row are saved. What happens
next decides whether an event can be lost, shown twice, or held up behind one huge job. Follow the
outbox, the planner and the batch jobs, then try the tabs: an issue on a popular repo, a relay
crash between publishing and marking sent, and a batch stuck on an overloaded shard.

```figure
watch-fanout
```

### Zoom in: the hybrid inbox read

Skipping popular repos at write time moves a little work to the read. Most of the page is already
in the user's list; the API only adds the few popular repos they watch, then hydrates and filters.
The tabs show a user returning after a long absence, a recents fetch that times out and degrades
the page, and a repository that turned private after its events were pushed.

```figure
inbox-merge
```

### How it scales

The design changes as the platform grows. It starts as pull on read, moves to push on write, then
to a hybrid with a watcher threshold, and finally to sharded inboxes with fan-out running in each
region.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| When to build inboxes | on read (pull) · on write (push) · hybrid | **Hybrid** | An open is one list read for almost everyone, and the cost of one event is capped by the threshold |
| Popular-repo threshold | fixed watcher count · measured write cost · none | **Watcher count in config** (e.g. 10 000) | Easy to explain and to change live when workers fall behind |
| What an inbox holds | full event copies · event ids | **Event ids, newest few hundred** | Small entries; edits, deletes and access changes are applied once, at hydration |
| Event transport | direct calls · queue · partitioned log + outbox | **Log fed by an outbox, keyed by repo** | Nothing lost between "saved" and "published", per-repo order, and room for more consumers |
| Second consumer (email) | send from the fan-out workers · separate consumer of the log | **Separate digest consumer** | Email is slow and batched; it must never hold up the inbox path |
| Work unit | one job per event · jobs of ≤ 500 watchers | **Bounded batch jobs** | No single event can block a worker for minutes, and a failed job retries alone |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Write amplification | a repo just under the threshold is very active | Workers lag and everyone's inbox is late | Bounded jobs, autoscale on queue depth, lower the threshold |
| Hot reads on recents | many readers watch the same popular repo | One cache node saturates | Replicate the recents, short local caches in the inbox API |
| Lost events | crash between saving and publishing | An event never reaches any watcher | Transactional outbox, publish before marking sent |
| Duplicate entries | relay or worker replays after a crash | The same event listed twice | Entries keyed by event id, dedup again in the merge |
| Leaked or stale entries | repo made private, issue deleted, watcher removed | Users see events they should not | Access and tombstone checks at hydration, capped lists that age out |
