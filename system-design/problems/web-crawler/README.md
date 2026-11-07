# Design a web crawler

> Difficulty: **medium** · Topics: web crawler, message queues, probabilistic structures, blob storage · ~50 min

Design the crawler that feeds a search engine's index. Starting from a set of seed URLs, it
downloads pages, pulls out the links, and keeps going, while keeping the collection fresh and
behaving like a good citizen on other people's servers.

## What the interviewer tells you if you ask
- Target: **2 billion pages per month**, HTML only (no images or video).
- An average page is about **100 KB**. Raw pages are kept for **6 months** so the indexing team
  can reprocess them.
- Over time the crawler will have discovered about **20 billion distinct URLs**.
- Roughly **a third** of fetched pages are copies or near-copies of pages already fetched
  (mirrors, tracking parameters, syndicated articles).
- Site owners complain loudly if you hit them more than about **once per second per host**, and
  they expect you to honour `robots.txt`.
- News sites change hourly; most of the web changes every few weeks or never.
- The web is hostile: endless calendar pages, slow servers, malformed HTML, spam link farms.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(the frontier, fetching, dedup, storage, recrawl…). Solve each part on its own: options, choice
and a small diagram. Then **reduce** them into one high-level design (v1 → v2 → v3 → v4),
followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first,
then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- What decides which URL is fetched next, and when?
- How do you stay at one request per second per host while running thousands of fetches in
  parallel?
- How do you know, cheaply, that a URL or a page's content has been seen before, out of billions?
- Where does the content go, and what does the indexing team read?
