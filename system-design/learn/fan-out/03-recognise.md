## How to recognise you need it

**Strong signals:**
- **One event, many recipients**: followers, group members, subscribers, viewers of a stream.
- The product promises fast reads of a **per-user aggregate** ("feed loads in 300 ms") built from
  many sources.
- A **skewed** fan-out degree: average 150–300, but a few senders have millions. That's the cue
  to bring up the hybrid.
- Reads far outnumber writes (10:1 or more), and a few seconds of delivery delay are acceptable.

**Anti-signals:**
- A recipient count of 1 (direct messages, order updates). There's nothing to fan out.
- Results that depend on the moment of reading (ranking by live signals, full-text search):
  you can't precompute them per user, so you query at read time.
- Write-heavy data that's rarely read: pushing it everywhere is wasted work.

**Look-alikes, and why they're different:**
- **[Message queues](#/learn/system-design/message-queues)** are the **transport** that makes
  fan-out on write asynchronous. The fan-out pattern decides **who gets a copy and when**.
- **[Real-time push](#/topic/system-design/real-time-push)** is about **delivering** to an
  online client over an open connection (WebSocket, SSE). Fan-out decides how many copies to
  make; push is the last hop to a screen.
- **[Caching](#/learn/system-design/caching)** keeps a copy of a result you already computed.
  A precomputed timeline is stored like a cache, but it's written **by the sender's action**,
  not filled on a read miss.
- **[Scatter-gather](#/topic/system-design/scatter-gather)** sends one **query** to many
  shards and merges the answers. That's the read side of pull, not a delivery pattern.

> [!DIALOGUE] Scoping a feed
> **Candidate:** How many daily users, and how often do they open the feed and post?
> **Interviewer:** 200 M daily users, about 10 opens a day, a post every other day.
> **Candidate:** And the follower distribution? Average, and the biggest accounts?
> **Interviewer:** Around 300 on average; the top accounts have tens of millions.
> **Candidate:** Then reads dominate, so I'll push by default, with a threshold above which big accounts are merged in at read time. Is a few seconds of delivery delay acceptable?
> **Interviewer:** Yes.

> [!PITFALL] Interview pitfalls
> - Choosing push or pull without the numbers: followers per user, opens/s, posts/s.
> - Forgetting the celebrity case, or not saying where the threshold sits and why.
> - Fanning out **synchronously** inside the post request, so the author waits for 40 M inserts.
> - Copying whole posts into timelines, which turns every edit and delete into another fan-out.
> - Keeping timelines for users who never come back.

**In our problems:**
- **news-feed**: distributing each post to followers is the core part of the design.
- **instagram**: getting a new photo into followers' feeds within seconds, with huge accounts.
- **chat-system**: delivering one group message to every member of a group of up to 200.
- **live-comments**: one comment has to reach every viewer of the same stream.
- **youtube**: one finished upload turns into many independent processing jobs.
