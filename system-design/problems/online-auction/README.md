# Design an online auction

> Difficulty: **hard** · Topics: online auction, consistency, real-time updates, scheduling · ~60 min

Design an auction site like eBay. Sellers list an item with a starting price and an end time.
Bidders place bids, and everyone watching the item sees the price climb live. When the clock runs
out, the highest bidder wins.

## What the interviewer tells you if you ask
- About **10 million active auctions** at any time. **1 million** end every day, most after
  7 days.
- About **10 million bids per day**, with traffic peaks around **10×** the average.
- A popular auction can draw **~10,000 watchers**, plus **50–100 bids per second** in its final
  minute. About **2 million** people are watching some auction at any moment.
- Watchers should see a new highest bid within **about a second**.
- An auction must close at its end time, to the second. A bid that arrives after the end must not
  win.
- Every bid must be kept: sellers and support use the history to settle disputes.
- Payment and shipping after the auction are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(bid placement, live updates, closing auctions…). Solve each part on its own: options, choice and a
small diagram. Then **reduce** them into one high-level design (v1 → v2 → …), followed by deep
dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then hint, and
*show* only as a last resort.

## Things worth deciding (no answers here)
- Two bids of $105 and $110 arrive in the same millisecond on a $100 item. What guarantees the
  right outcome?
- How does a bid accepted on one server reach a watcher connected to another server?
- What ends an auction when no request arrives at that moment? And what stops a bid that arrives
  5 ms late?
- Whose clock decides when an auction is over?
- What do you store so that a disputed result can be explained a month later?
- What changes if one auction gets 500 bids per second?
