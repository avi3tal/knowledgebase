# Design WhatsApp (chat system)

> Difficulty: **medium** · Topics: chat system, message queues, networking, databases, sharding · ~50 min

Design the backend of a mobile and web messaging app like WhatsApp or Messenger. People chat
one-to-one and in small groups, see messages appear while the conversation is open, and find their
history on any device.

## What the interviewer tells you if you ask
- **50 million daily active users**; an average user sends about **40 messages a day**.
- At the evening peak roughly **1 in 5** daily users is connected at the same time, and peak
  traffic is about **3×** the daily average.
- Groups are capped at **200 members**. About a third of messages go to groups.
- A message is short text: budget roughly **200 bytes** stored per message including metadata.
  Media (images, video) is uploaded elsewhere; messages only carry a link.
- When both people are online the message should show up in **well under a second**.
- History is kept for **one year** and must be readable from a newly signed-in phone or laptop.
- Recipients who are not connected should still find out that something arrived.
- Online indicators and read receipts are welcome but secondary.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(connections, ordering, offline delivery, groups…). Solve each part on its own: options, choice and
a small diagram. Then **reduce** them into one high-level design (v1 → v2 → v3 → v4), followed by
deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then hint, and
*show* only as a last resort.

## Things worth deciding (no answers here)
- How does the server get a new message to a phone that is sitting idle with the app open?
- A user is connected to one of hundreds of servers. How does the sender's server find it?
- What keeps messages in a conversation in the same order on every device, and stops duplicates
  when the network retries?
- How does a message for a 200-person group get delivered without slowing the sender down?
- What does a phone that was offline for a day do when it comes back?
