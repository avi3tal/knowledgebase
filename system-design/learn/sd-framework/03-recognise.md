## Signals and pitfalls

**What interviewers listen for:**
- You **ask before you build**: requirements, scale, what's out of scope.
- Every component is **justified** by a requirement or a number.
- You **name trade-offs** (consistency vs latency, cost vs simplicity) instead of presenting
  one option as obviously right.
- You **drive**: you keep track of the clock, say what you'll cover next, and invite input
  ("I'd like to dive into id generation and caching. Is there anything you'd prefer?").

**Common pitfalls:**
- Jumping to boxes, or worse, to specific products, in minute one.
- Designing for Google scale when the numbers say one database is fine. Over-engineering is
  as bad as under-engineering.
- A diagram with no API or data model, so nobody can tell what the boxes actually do.
- Spending 30 minutes on scope and running out of time for the deep dive.
- Treating non-functional requirements as an afterthought. They pick the architecture.
- A wrap-up that is just "it scales". Name the first bottleneck and the failure plan.

**Which topic next?** The framework tells you *where you are*. The building-block lessons tell
you *what to reach for*:
- Numbers needed → back-of-the-envelope estimation.
- Read-heavy with repeats → caching (and a CDN for static content).
- Too many writes or too much data for one node → sharding.
- Bursty or slow background work → message queues.
- Per-client quotas or abuse → rate limiting.
- Many identical stateless servers → load balancing.
