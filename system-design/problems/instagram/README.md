# Design Instagram (photo sharing)

> Difficulty: **medium** · Topics: photo sharing, blob storage, CDN, news feed, caching · ~50 min

Design a photo-sharing app. People upload photos with a caption, follow other accounts, scroll a
home feed of photos from the accounts they follow, and like photos. Every photo shows its like count.

## What the interviewer tells you if you ask
- **500 million daily active users**. Together they upload about **100 million photos a day**.
- The average user opens the feed about **10 times a day** and likes about **8 photos a day**.
  Peak traffic is roughly **2–2.5×** the daily average.
- An original photo is about **2 MB**. The app shows a few sizes (thumbnail, feed, full screen).
- The average account has about **150 followers**; a handful have **hundreds of millions**. A
  celebrity's photo can collect **thousands of likes per second** in its first minutes.
- A feed page shows **10 photos** and should load in **under 500 ms**, worldwide.
- A new photo should reach followers within **about 5 seconds** of finishing processing.
- Like counts may lag a few seconds, but a user's own like must show at once and count once.
- Losing a photo after the upload was acknowledged is **not acceptable**.
- Video, stories, comments, direct messages and search are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(the upload pipeline, the follow graph, feed generation, likes…). Solve each part on its own:
options, choice and a small diagram. Then **reduce** them into one high-level design
(v1 → v2 → …), followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck:
nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Should photo bytes pass through your API servers at all? Who makes the smaller sizes, and when?
- How do you store "who follows whom" so that both directions are cheap to read?
- Is a feed assembled when it is opened, or prepared when a photo is posted? What changes for an
  account with 300 million followers?
- What happens to a single counter when thousands of people like the same photo in one second?
- How do you count a double tap or a network retry only once?
