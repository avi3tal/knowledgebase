# Design metrics monitoring and alerting

> Difficulty: **hard** · Topics: metrics monitoring, observability, stream processing, sharding · ~60 min

Design a monitoring system like Datadog or Prometheus. An agent on every server sends numeric metrics
such as CPU, request rate, latency percentiles and queue depth, each tagged with labels like
`service=checkout, host=web-42`. Engineers build dashboards on top of them, and alert rules page the
on-call engineer when something goes wrong.

## What the interviewer tells you if you ask
- **100,000 hosts**, each emitting about **500 time series**, sampled every **10 seconds**.
- Keep raw data for **15 days**. Graphs over months or years can use coarser data, kept for **2 years**.
- About **5,000 dashboards** are open at any time, each with ~20 panels that refresh every
  **30 seconds**. A panel over the last hour should load in **under a second**.
- About **50,000 alert rules**. An alert should fire within **about a minute** of the condition
  becoming true. On-call engineers hate duplicate and flapping pages.
- The monitoring system must keep working **while the systems it watches are failing**.
- Logs, traces and ML anomaly detection are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(ingestion, storage and retention, queries, alerting…). Solve each part on its own: options, choice
and a small diagram. Then **reduce** them into one high-level design (v1 → v2 → …), followed by deep
dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then hint, and *show*
only as a last resort.

## Things worth deciding (no answers here)
- Should agents push their data, or should the system pull it? What changes at 100k hosts?
- What happens to incoming data when storage is slow for ten minutes?
- How many bytes does one datapoint really need, and why is a regular SQL table a poor fit?
- How does a graph covering one year stay fast?
- Who evaluates the alert rules, how often, and against which data?
- How do you avoid paging someone 500 times for a single outage?
- What happens when someone adds a `user_id` tag to a metric?
