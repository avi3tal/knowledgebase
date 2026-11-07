# Design a notification system

> Difficulty: **medium** · Topics: notification system, message queues, rate limiting, third-party APIs · ~50 min

Many teams in your company need to tell users things: "your order shipped", "your login code is
482913", "someone replied to you", "weekend sale starts now". Design one shared platform that
every team calls to reach users on their phones (push), by SMS and by email.

## What the interviewer tells you if you ask
- About **500 million notifications a day** in total: roughly **400M push**, **80M email** and
  **20M SMS**.
- Marketing campaigns create bursts of about **10×** the daily average for an hour or two.
- **300 million** registered devices; a user can have several (phone, tablet).
- Login codes and password resets must arrive **within a few seconds**, even in the middle of a
  campaign. Marketing can arrive minutes late.
- Users can switch off categories or whole channels, and must never get marketing they opted out
  of. Product also caps marketing at a few messages per user per day.
- Delivery goes through **third-party providers** (Apple, Google, an SMS vendor, an email
  vendor). They throttle you, have outages, and SMS costs money per message.
- Teams want to know whether a notification was sent, failed or was suppressed. Keep that
  history for **30 days**.

## Your job
Work through the stages in the console: scope → estimates → API & data → high-level design
(evolve it: v1 → v2 → v3) → deep dives with trade-offs → wrap-up. Use the checklist on the right
and ask for tips when stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Should a calling team wait while you talk to Apple or the SMS vendor?
- How do login codes stay fast while a 50-million-user campaign is going out?
- A provider times out. Do you retry, and how do you avoid sending the same SMS twice?
- Where are opt-outs and frequency caps enforced so no path can skip them?
