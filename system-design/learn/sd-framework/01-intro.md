# How to Approach a Design Interview

> Fundamentals · scope → high-level design → deep dive → wrap-up

A design interview is an open-ended problem with a 45-minute clock and no single right answer.
You're scored on **how you think**: whether you clarify before building, back decisions with
numbers, start simple and evolve, and name trade-offs. Freezing up and over-engineering both
come from not having a plan. This is the plan.

```
 ~5–8 min          ~10–15 min             ~15–20 min           ~3–5 min
┌──────────┐     ┌───────────────┐      ┌──────────────┐     ┌───────────┐
│ 1 SCOPE  │ ──► │ 2 HIGH-LEVEL  │ ──►  │ 3 DEEP DIVE  │ ──► │ 4 WRAP-UP │
│ reqs +   │     │ API, data,    │      │ 2–3 hardest  │     │ bottle-   │
│ numbers  │     │ boxes v1→v2   │      │ parts, trade-│     │ necks,    │
│          │     │               │      │ offs         │     │ failures  │
└──────────┘     └───────────────┘      └──────────────┘     └───────────┘
```

## 1. Scope: understand the problem
- **Functional requirements:** the 3–5 things users must be able to do. Say explicitly what's
  **out of scope**.
- **Non-functional requirements:** scale, latency, availability, consistency, durability.
  These, not the features, decide the architecture.
- **Assumptions and numbers:** ask for DAU, read/write mix, object sizes, retention. Then do a
  quick **back-of-the-envelope** estimate: QPS (and peak), storage, bandwidth.
- End with a one-line summary you and the interviewer agree on.

## 2. High-level design: get something working end to end
- **API:** the main endpoints or calls, with request and response shapes.
- **Data model:** the main entities, their key fields, and which kind of store each needs.
- **Diagram v1:** the simplest design that meets the functional requirements: client →
  service → database. Then **evolve** it. Each new box must answer a requirement or a number
  from step 1: "v2 adds a cache because peak reads are 17k/s".
- Walk one request through the diagram (the read path and the write path).

## 3. Deep dive: where the interview is decided
Pick the **2–3 hardest or most interesting** parts, or ask the interviewer which they prefer.
For each one:
- State the problem ("how do we generate unique ids across 20 servers?").
- Give **2–3 options** with pros and cons.
- **Choose** one and say **why**, tied to a requirement.

## 4. Wrap-up: show you'd run this in production
- **Bottlenecks:** what breaks first at 10× load?
- **Failure modes:** a node, a zone, a dependency goes down. What happens?
- **Monitoring:** the 3–5 metrics and alerts you'd watch.
- **Scaling further** and **future work:** what you'd do with more time.
