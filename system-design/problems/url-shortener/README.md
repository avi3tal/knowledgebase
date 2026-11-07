# Design a URL shortener

> Difficulty: **easy** · Topics: URL shortener, unique IDs, caching, data stores · ~45 min

Design a service like a link shortener: users paste a long URL and get a short one such as
`https://sho.rt/aZ3kQ9x`. Anyone who opens the short link is redirected to the original page.

## What the interviewer tells you if you ask
- About **100 million new links per month**; links are read far more often than they are created
  (assume roughly **100 reads per write**).
- Links should keep working for **5 years** by default; custom aliases are a nice-to-have.
- Redirects must feel instant: aim for **tens of milliseconds** at the edge, worldwide.
- Basic click analytics (count per link) would be welcome, but it must never slow the redirect.

## Your job
Work through the stages in the console: scope → estimates → API & data → high-level design
(evolve it: v1 → v2 → v3) → deep dives with trade-offs → wrap-up. Use the checklist on the right
and ask for tips when stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- How do you generate short codes that are short, unique and hard to guess?
- What happens to the redirect path when traffic is 100× the write path?
- Where do analytics events go so they never block a redirect?
