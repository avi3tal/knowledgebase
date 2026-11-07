# Design post search

> Difficulty: **hard** · Topics: post search, search indexing, sharding, stream processing, caching · ~55 min

Design search over the posts of a large social network, like searching a social network's public
posts. A user types a few words or a hashtag. They get matching posts, either "Top" (best matches) or
"Latest" (newest first), and can scroll for more.

## What the interviewer tells you if you ask
- About **500 million new posts a day**, mostly short text with around **30 searchable words** each.
  Peak posting is about **2.5×** the average.
- About **200 million searches a day**. During big live events search traffic jumps about **5×**
  within minutes, and many people type the same thing.
- Posts from the last **5 years** must be searchable. Most searches only care about the **last week**.
- A new post should be findable within about **10 seconds**. A search should answer in **under
  500 ms**.
- Likes and reposts (about **5 billion a day**) should influence "Top".
- A deleted or hidden post must vanish from results within about **a minute**.
- Only public posts. People search, typeahead and ads are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(getting posts into the index, splitting the index, answering a query, freshness…). Solve each part
on its own: options, choice and a small diagram. Then **reduce** them into one high-level design
(v1 → v2 → …), followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck:
nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Should the service that stores a post also write it into the search index?
- If the index is split across hundreds of machines, should it be split by word or by post? What
  does each choice do to writes and to queries?
- One query has to ask many machines. What happens when one of them is slow?
- Does every like have to rewrite the indexed post?
- How do you remove a post from index files that are never modified in place?
