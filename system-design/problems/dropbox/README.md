# Design Dropbox (file sync)

> Difficulty: **hard** · Topics: file sync, blob storage, sharding, replication · ~60 min

Design a file hosting and sync service. A user drops files into a folder on their laptop; the same
files appear on their phone, their other computers and the web, and on the machines of people they
share the folder with. Edits anywhere flow everywhere, and old versions can be restored.

## What the interviewer tells you if you ask
- **500 million users**, **100 million daily active**. Each user has ~**2–3 devices**, about two of
  them online at any time.
- An active user changes ~**10 files a day**; an average change is about **1 MB**, but files can be
  as large as **50 GB**.
- An average user stores ~**5 GB** across ~**1,000 files**.
- A change should show up on the user's other online devices within **about 10 seconds**.
- Many clients are on **phones and flaky networks**; uploads get interrupted all the time.
- Keep **30 days of version history**, including deleted files.
- People edit while **offline** (planes, trains) and expect it to sync later.
- Losing a user's file is the worst possible outcome.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(moving the bytes, the file tree and its history, telling devices about changes, simultaneous
edits…). Solve each part on its own: options, choice and a small diagram. Then **reduce** them into
one high-level design (v1 → v2 → v3), followed by deep dives and wrap-up. Use the checklist and ask
for tips when stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- When a user changes one paragraph of a 2 GB file, how many bytes should cross the network?
- Should file bytes pass through your servers at all?
- Where do the file tree and its history live, and how do you split them across machines?
- How does a phone learn, within seconds, that something changed, without asking every second?
- A laptop and a phone both edit the same file offline. What does each of them see afterwards?
- When is it safe to delete stored bytes?
