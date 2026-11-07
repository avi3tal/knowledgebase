# Design Ticketmaster (ticket booking)

> Difficulty: **hard** · Topics: ticket booking, distributed transactions, caching, admission control · ~60 min

Design a ticketing site for concerts and sports events. Fans browse and search events, open an
event's seat map, pick seats, and pay. When a stadium tour goes on sale, millions of fans arrive at
the same second for a few tens of thousands of seats.

## What the interviewer tells you if you ask
- About **10 million daily users**, each viewing ~20 pages; around **1 million tickets** are sold
  on a normal day.
- About **100,000 events per year**, with ~5,000 seats on average and up to **80,000** in the
  biggest stadiums.
- A hot on-sale brings **~10 million fans** for **~50,000 seats**, almost all of them in the first
  10 minutes.
- Once fans pick seats, they get **10 minutes** to pay. If they don't, the seats go back on sale.
- Selling a seat twice is unacceptable. A seat map that is a few seconds old is fine.
- Payments go through an external payment provider. You never store card numbers.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(the browse path, seat holds, the on-sale rush, payment…). Solve each part on its own: options,
choice and a small diagram. Then **reduce** them into one high-level design (v1 → v2 → …),
followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first,
then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Two fans click the same seat in the same millisecond. Who wins, and where is that decided?
- How does a seat come back on sale when a fan abandons checkout, and what releases it?
- Should 10 million fans all reach your booking service? If not, how do you choose who goes first?
- How fresh does the seat map need to be, and what does freshness cost you?
- The payment provider times out and the fan clicks "Pay" again. What stops a double charge?
- What happens when a payment succeeds after the hold has expired?
