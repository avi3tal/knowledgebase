# Design live comments

> Difficulty: **medium** · Topics: live comments, real-time push, message queues, caching, CDN · ~45 min

Design the comment stream that runs next to a live video, as on Facebook Live, YouTube Live or
Twitch. Viewers type short comments, and everyone watching the same stream sees them scroll by
within moments, whether a stream has 30 viewers or a world-cup final has millions.

## What the interviewer tells you if you ask
- At peak about **20 million people** are watching live, spread over roughly **100,000 live
  videos**.
- The biggest single stream can have **5 million concurrent viewers**, and its comments can peak at
  **10,000 per second**.
- A watching viewer posts about **one comment every 10 minutes**. A comment is at most **200
  characters**: budget about **300 bytes** stored.
- A comment should appear on other viewers' screens within **2 seconds**.
- Nobody can read more than about **10 comments a second**. Product is fine with not showing
  every comment live on a huge stream, but a posted comment must never be lost.
- Someone who joins mid-stream should see the **last ~50 comments** immediately. Comments are kept
  for replay alongside the recording.
- Streamers and moderators can delete a comment, and it should vanish from screens. Some words
  are blocked outright.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(posting, delivery, the hot stream, joiners…). Solve each part on its own: options, choice and a
small diagram. Then **reduce** them into one high-level design (v1 → v2 → v3 → v4), followed by
deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then hint, and
*show* only as a last resort.

## Things worth deciding (no answers here)
- How does a comment get to millions of screens without the server doing work per viewer?
- What do you send to 5 million people when 10,000 comments arrive every second?
- How do you make sure a comment that is shown is also stored, and the other way round?
- A million people open the same stream in one minute. What do they all ask for first?
- How does a deleted comment disappear from screens that already show it?
