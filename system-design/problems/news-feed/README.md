# Design a news feed

> Difficulty: **medium** · Topics: news feed, caching, message queues, fan-out · ~50 min

Design the home feed of a social app. People follow other accounts and publish short posts
(text, optionally a photo or video). Opening the app shows a feed of recent posts from the
accounts you follow, newest first, with infinite scroll.

## What the interviewer tells you if you ask
- **200 million daily active users**. The average user opens the feed about **10 times a day**
  and publishes about **one post every two days**.
- Peak traffic is roughly **2×** the daily average.
- The average account has about **300 followers**, but a few thousand accounts have **tens of
  millions**.
- A feed page shows **20 posts**; the feed should load in **under 300 ms**.
- A new post should show up in followers' feeds **within about 10 seconds**; a little staleness
  is fine. Strict chronological order is good enough for v1 (no ML ranking).
- Photos and videos are a large share of the bytes, viewed all over the world.

## Your job
Work through the stages in the console: scope → estimates → API & data → high-level design
(evolve it: v1 → v2 → v3) → deep dives with trade-offs → wrap-up. Use the checklist on the right
and ask for tips when stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Is a user's feed assembled when they open the app, or prepared ahead of time? What does each
  choice cost?
- What happens when an account with 40 million followers posts?
- Where do feeds and posts live so a page loads in 300 ms at peak?
- How do you page through a feed that keeps changing while the user scrolls?
