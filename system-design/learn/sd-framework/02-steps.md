## Step 2: High-level design

Get something working end to end before making anything clever.

- **API:** the 2–4 main calls with request and response shapes, e.g.
  `POST /notifications {user, channel, template, data} → 202 {id}`.
- **Data model:** the main entities, their key fields, and which kind of store each needs.
- **Decompose → reduce:** split the problem into **parts**, one per hard requirement (the hot
  read path, the ingest path, fan-out, search…). Solve each part on its own with a small diagram,
  then **merge** the parts into one high-level design. Parts that reuse the same node ids (the
  same API service, the same database) snap together.
- **Evolve it:** v1 is the simplest thing that meets the functional requirements. Every later
  version fixes a named flaw.

```figure
evolve-loop
```

Walk one request through the final diagram: a **write** from client to storage, then a **read**.
If you can't narrate a path, a box or an arrow is missing.

> [!PITFALL]
> Drawing the "final" architecture first, with a cache, a queue and a search cluster before any
> requirement asked for them. The interviewer can't tell which boxes you need and which you
> memorised.

## Step 3: Deep dives

This is where the interview is decided. Pick the **2–3 hardest or most interesting** parts, or
let the interviewer pick, and run the same loop for each:

```figure
deep-dive
```

What to cover depends on the problem: unique ids across many servers, keeping a cache and a
database consistent, hot keys, fan-out on write versus on read, exactly-once side effects.

> [!INTERVIEW] What to say
> "There are two options here. A gives us X but costs Y; B is the reverse. Since our requirement
> is N2, a few seconds of staleness is fine, I'll take A. If that requirement changed, I'd switch
> to B." A trade-off, a choice, the requirement that decided it, and when you'd change your mind.

## Step 4: Wrap-up

Show you would run this in production, not just draw it.

- **Bottleneck:** what breaks first at 10× load, and what you'd do about it.
- **Failure modes:** a node, a zone, a dependency goes down. What does the user see?
- **Monitoring:** the 3–5 metrics you'd alert on (error rate, p99 latency, queue lag…).
- **Next:** what you'd add with more time.

> [!TIP]
> If time is short, do the wrap-up as three quick sentences rather than skipping it. "The
> sorted set is the first bottleneck; we'd shard it by score range. If it dies we rebuild it from
> the DB. I'd alert on update lag." That's 20 seconds and covers all three points.
