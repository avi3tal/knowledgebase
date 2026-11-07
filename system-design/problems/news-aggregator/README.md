# Design a news aggregator

> Difficulty: **hard** · Topics: news aggregator, web crawler, stream processing, caching, CDN · ~55 min

Design a service like a news aggregator. It writes no articles itself. It collects articles from
thousands of publishers and groups coverage of the same event into one story. It shows readers the
top stories for their country and language, plus a personal "For you" section. Clicking a headline
opens the publisher's site.

## What the interviewer tells you if you ask
- About **50,000 publishers**. They expose RSS/Atom feeds and sitemaps, and a few hundred large ones
  can also *push* a notification when they publish.
- Together they publish about **2 million articles a day**, with bursts of around **100 per second**
  when big news breaks.
- A big event is covered by **hundreds of outlets**, and wire stories are syndicated almost word for
  word.
- **100 million daily readers**, about **5 page views** each. Breaking news multiplies traffic by
  **about 5×** within minutes.
- A breaking story should appear within **about 5 minutes** of first publication. The home page
  should load in **under 200 ms**.
- Keep about **5 KB of metadata** per article for a year. Full text is only needed for **30 days**.
- Small publishers must never be overloaded by your crawler.
- Search, comments and paywalls are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(ingestion, grouping coverage, ranking, serving…). Solve each part on its own: options, choice and
a small diagram. Then **reduce** them into one high-level design (v1 → v2 → …), followed by deep
dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then hint, and
*show* only as a last resort.

## Things worth deciding (no answers here)
- How do you find a new article within minutes without polling 50,000 feeds every minute?
- How do you tell "the same text, copied" from "a different article about the same event"?
- Is the order of stories computed per request, per reader, or once for everyone? Which part
  really has to be personal?
- What absorbs a 5× spike that arrives within minutes of a big story breaking?
- What should the reader see if the processing pipeline falls behind?
