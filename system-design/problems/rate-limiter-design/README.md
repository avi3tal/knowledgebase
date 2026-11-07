# Design a rate limiter

> Difficulty: **easy** · Topics: rate limiter, rate limiting, caching, API design · ~45 min

Your company runs a public HTTP API used by mobile apps, web apps and third-party developers.
Some clients hammer it: scrapers, buggy retry loops, the occasional credential-stuffing attack.
Design the component that decides, for every incoming request, whether it may proceed or must be
turned away, and tells the caller what happened.

## What the interviewer tells you if you ask
- About **10 million distinct clients** (signed-in users, API keys, anonymous IPs) are active on a
  typical day.
- Peak traffic is about **300,000 requests per second**, served by roughly **40 stateless API
  servers**. A request can land on any server.
- Limits differ by who and what: e.g. **100 requests per minute per user**, **5,000 per hour per
  API key**, a coarse per-IP limit for anonymous traffic, and a much stricter limit on the login
  endpoint. Product wants to change limits **without a deploy**.
- The check may add **no more than a few milliseconds** (budget: 5 ms at p99).
- Product says a full API outage is worse than a few minutes of over-quota traffic. Security says
  the login endpoint is a different story.
- Limits should be roughly right across the whole fleet: a user must not get 40× the quota just
  because the load balancer spread their calls.

## Your job
Work through the stages in the console: scope → estimates → API & data → high-level design
(evolve it: v1 → v2 → v3) → deep dives with trade-offs → wrap-up. Use the checklist on the right
and ask for tips when stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Where in the request path does the check run, and where do the counts live?
- Which counting algorithm, and how does it treat bursts at window boundaries?
- Two servers increment the same client's count at the same instant. What happens?
- What should happen to traffic when the limiter itself is slow or down?
