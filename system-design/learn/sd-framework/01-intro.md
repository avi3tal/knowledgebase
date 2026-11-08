# How to Approach a Design Interview

> Fundamentals · scope → high-level design (decompose → reduce) → deep dives → wrap-up

A design interview is an open-ended problem, a 45-minute clock and no single right answer. The
interviewer is grading **how you get to a design**: do you clarify before building, back each
decision with a number, start simple and evolve, and name the trade-offs? Freezing and
over-engineering have the same cause: no plan. Here is the plan.

The tabs show what happens when you skip scoping, run out of time, or the interviewer steers you.

```figure
four-steps
```

## Budget the clock

| step | minutes (of 45) | you leave it with |
|---|---|---|
| 1 Scope | 5–8 | agreed features, NFR targets, 4–6 estimates |
| 2 High level | 10–15 | API, data model, parts merged into one diagram |
| 3 Deep dives | 15–20 | 2–3 hard parts, each with a choice and a reason |
| 4 Wrap-up | 3–5 | first bottleneck, failure plan, metrics |

The most common failure is a 25-minute scope and no deep dive. Glance at the clock at each step
boundary and say where you are: "Scope is settled, let me sketch the high level."

## Step 1: Scope

Three things to pin down, in this order:

- **Functional requirements:** the 3–5 things users must be able to do. Say what is **out of
  scope** just as clearly; it frees time for the parts that matter.
- **Non-functional requirements:** scale, latency, availability, consistency, durability. These
  pick the architecture far more than the features do.
- **Numbers:** daily users, read/write mix, object sizes, retention. Turn them into QPS, peak,
  storage and bandwidth with a quick back-of-the-envelope estimate.

Ask, don't interrogate. Offer a sensible default with each question so the interviewer can just
say yes.

> [!DIALOGUE] Scoping "design a notification service"
> **Candidate:** Which channels: push, email, SMS, or all three?
> **Interviewer:** Push and email. SMS later.
> **Candidate:** Who sends them? Other internal services calling an API, or marketing campaigns too?
> **Interviewer:** Internal services. Campaigns are out of scope.
> **Candidate:** Roughly how many per day, and how fast must they arrive?
> **Interviewer:** About 100 million a day. A few seconds is fine for most.
> **Candidate:** Is a duplicate worse than a missed one? That decides at-least-once versus at-most-once.
> **Interviewer:** A rare duplicate is acceptable; losing one is not.
> **Candidate:** So: push and email from internal callers, ~1 200/s on average with bursts, delivered within seconds, at-least-once. I'll estimate from there.

> [!INTERVIEW] Close the step with a summary
> One sentence that both of you agree on: what it does, for whom, at what scale, with which
> guarantee. Everything you draw afterwards should trace back to a word in that sentence.

> [!TIP]
> Write the requirements down where both of you can see them and number them (F1, F2, N1…).
> Later you can say "this cache is for N1" instead of re-explaining.
