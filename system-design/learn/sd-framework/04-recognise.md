## Dos and don'ts

| do | don't |
|---|---|
| Ask clarifying questions, each with a default you'd assume | Start drawing in minute one, or name products before requirements |
| Write the requirements and numbers where both of you can see them | Keep the numbers in your head and never use them |
| Start with v1 and evolve it, one justified box at a time | Present a memorised "final" architecture |
| Think out loud and invite input: "Any part you'd like me to go deep on?" | Go silent for minutes, or argue when the interviewer nudges you |
| Give 2–3 options, then commit to one and say why | List options and never choose |
| Watch the clock and say which step you're in | Spend half the slot on scope |
| Size the design to the numbers | Design for Google scale when one database is enough |

**What interviewers listen for:**
- You **ask before you build**: requirements, scale, what's out of scope.
- Every component is **justified** by a requirement or a number.
- You **name trade-offs** (consistency vs latency, cost vs simplicity) instead of presenting
  one option as obviously right.
- You **drive**: you keep track of the time, say what's next, and treat the interviewer as a
  teammate.

> [!PITFALL] Common ways to lose the interview
> - A diagram with no API or data model, so nobody can tell what the boxes do.
> - Non-functional requirements treated as an afterthought. They pick the architecture.
> - A deep dive that explains a technology instead of making a decision.
> - A wrap-up that is just "it scales". Name the first bottleneck and the failure plan.
> - Over-engineering. Extra boxes are as costly as missing ones.

## Which topic next?

The framework tells you **where you are**; the building-block lessons tell you **what to reach
for**:

| you notice | reach for |
|---|---|
| numbers needed before a decision | back-of-the-envelope estimation |
| read-heavy, repeated data | caching (and a CDN for static content) |
| too many writes or too much data for one node | sharding |
| bursty or slow background work | message queues |
| per-client quotas or abuse | rate limiting |
| many identical stateless servers | load balancing |
