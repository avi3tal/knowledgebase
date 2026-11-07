# Design local delivery (Gopuff)

> Difficulty: **medium** · Topics: local delivery, proximity, caching, transactions · ~60 min

Design a quick-commerce app like Gopuff. The company runs its own small warehouses in each city.
Customers see what can be delivered to their address, order a cart of snacks and groceries, and a
driver brings it from the nearest warehouse in about 30 minutes.

## What the interviewer tells you if you ask
- About **500 warehouses**, each stocking **~5,000 products**.
- **10 million daily users**, each looking at availability **~20 times** a day. About **500,000
  orders** per day, busiest in the evening (~5× the average).
- The promise is delivery in **~30 minutes**, so a warehouse can only serve addresses within about
  30 minutes of travel. Some addresses are covered by two or three warehouses.
- An order is filled by **one warehouse**. Telling a customer an item is in stock and then
  cancelling is the worst experience.
- The app should feel instant: availability in **under 100 ms**.
- **20,000 active drivers** send their GPS position every **5 seconds**.
- Restocking warehouses, pricing and driver payroll are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(what's available here, placing orders, dispatching drivers, ETA…). Solve each part on its own:
options, choice and a small diagram. Then **reduce** them into one high-level design (v1 → v2 →
…), followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first,
then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- How do you find which warehouses can serve an address, and does straight-line distance work?
- How large is all the inventory data? What does that size let you do?
- Two customers buy the last unit at the same moment. Where is that decided?
- The stock is taken, then the card is declined. What gives the stock back?
- How stale can the "in stock" badge be, and what protects you when it's wrong?
- Should a driver be assigned the moment an order is placed?
