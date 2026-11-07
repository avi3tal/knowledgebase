# Design search autocomplete (typeahead)

> Difficulty: **medium** · Topics: search autocomplete, caching, CDN, stream processing · ~45 min

Design the suggestion box of a large search engine. As the user types `how to b`, a dropdown
shows the most likely full queries (`how to boil an egg`, `how to buy bitcoin`, …) and updates
with every keystroke.

## What the interviewer tells you if you ask
- About **1 billion searches per day**. With debouncing, typing a query sends roughly **5
  suggestion requests**.
- Show up to **10 suggestions**, ordered by how popular the full query has been **recently**.
- Suggestions must keep up with typing: **under 100 ms end to end**, for users worldwide.
- After pruning rare ones, about **100 million distinct queries** are worth suggesting. The average
  query is about **20 characters**.
- When news breaks, people expect its query to be suggested **within about 10 minutes**. General
  rankings may lag by an hour.
- Some queries must never be suggested (offensive, legally blocked). English only; no personalisation
  for now.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(the lookup structure, where rankings come from, the request path, freshness…). Solve each part
on its own: options, choice and a small diagram. Then **reduce** them into one high-level design
(v1 → v2 → v3 → v4), followed by deep dives and wrap-up. Use the checklist and ask for tips when
stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- What exactly is looked up on each keystroke, and how much work does that lookup do?
- Who computes the popularity of queries, from what data, and how often?
- Which requests never need to reach your servers at all?
- How does a query that didn't exist an hour ago show up in suggestions?
- How do you publish new rankings without users ever seeing a half-updated list?
