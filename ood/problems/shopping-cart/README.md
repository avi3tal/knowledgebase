# Design a shopping cart with promotions

> Difficulty: **medium** · Topics: behavioral patterns, SOLID, OOP basics, UML · ~45 min

Design the object model for an online shop's shopping cart. A shopper adds products to the cart,
deletes them (all of a product, or some of its quantity) and asks for the total price at any time.
The shop runs promotions, and the total must reflect them. Implement `AddItem`, `DeleteItem` and
`GetTotalPrice` (in the console's Python signatures: `add_item`, `delete_item`, `get_total_price`).

Two kinds of promotion must be supported:
1. **Buy N, get M free** on a product, e.g. *2 + 1*: buy two apples, the third is free.
2. **Percentage off**, e.g. *10% off* all dairy products.

## What the interviewer tells you if you ask
- Prices are in one currency. Promotions are configured by the shop (not by the shopper) and do not
  change while a cart is open.
- A product is identified by its **SKU** and has a unit price; a percentage promotion can target one
  SKU or a whole **category**.
- Carts are small (usually under **50 lines**), but the total is shown on **every page** and is read
  far more often than the cart changes. Reading it must be cheap.
- Promotions can be added later (the marketing team already talks about fixed-amount coupons and
  "buy A, get B"); adding one must not mean editing the cart.
- Deleting more units than the cart holds just empties that line. Deleting a product that isn't in
  the cart is an error.
- Taxes, shipping, stock and payment are handled by other teams.

## Your job
Work through the console stages: scope (requirements, **assumptions** about money and rounding,
out of scope) → API (the public operations) and data (the domain objects and their state) → class
diagram (v1 the core objects → v2 the abstraction that lets promotions vary → v3 whatever makes
reading the total cheap) → deep dives (the decisions and why) → wrap-up → signatures (Python
classes and method signatures only, with sensible **visibility**: what is public, what is
internal). Use the checklist and ask for tips: nudge first, then hint, and *show* only as a last
resort.

## Things worth deciding (no answers here)
- How is money represented so that `0.1 + 0.2` problems can't happen, and how do you round 10% of
  3.33?
- Where does each kind of promotion's arithmetic live, so that a third kind is a new class and not
  a new `elif`?
- If two promotions match the same product, which one wins? Can they stack?
- `GetTotalPrice` is called on every page. What can be computed once, when the cart changes, so a
  read does no work?
- Which fields and helpers should the outside world never touch, and how do you expose the cart's
  contents without letting callers change them behind its back?
- Which test cases prove the promotions are right at their edges (exactly N items, N + M, one more)?
