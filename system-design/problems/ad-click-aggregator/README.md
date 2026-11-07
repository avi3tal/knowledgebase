# Design an ad click aggregator

> Difficulty: **hard** · Topics: ad click aggregator, stream processing, message queues, data stores · ~60 min

An ad network shows ads on many websites and apps. When a user clicks one, they should land on
the advertiser's page, and the click should be counted. Advertisers watch near-real-time charts
of clicks per ad and campaign, and they are **billed per click**. Design the system that records
the clicks and turns them into those numbers.

## What the interviewer tells you if you ask
- About **1 billion clicks per day**. Big events (a sports final, a shopping holiday) bring peaks
  of about **5×** the average.
- About **10 million active ads**, grouped into campaigns.
- The redirect to the landing page must feel instant: **under 50 ms** at p99. If counting breaks,
  users must still get where they clicked.
- Advertisers want clicks **per minute** for recent data, and per hour or day for ranges up to
  **90 days**. Charts should be at most **about a minute** behind and load in **under a second**.
- Billing must be exact. Users double-click, links get replayed, and servers retry. **Each real click
  counts once and no click is lost.**
- Raw click events are kept for **90 days** for audits. A click event is about **200 bytes**.
- Some clicks arrive **minutes late** (mobile devices that were offline).

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(capturing clicks, counting them, counting each once, querying, a source of truth…). Solve each
part on its own: options, choice and a small diagram. Then **reduce** them into one high-level
design (v1 → v2 → v3), followed by deep dives and wrap-up. Use the checklist and ask for tips when
stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- What is the least the click request must do before redirecting, without risking the click?
- Where does counting happen, and in which minute does a late click belong?
- What identifies "the same click", and what keeps a crash and restart from counting it twice?
- What do dashboards read, so that a 90-day chart doesn't scan billions of rows?
- If the counting pipeline was wrong for three hours, how would you know, and how would you fix the
  bills?
