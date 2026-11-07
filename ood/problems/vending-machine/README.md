# Design a vending machine

> Difficulty: **medium** · Topics: vending machine, behavioral patterns, SOLID · ~40 min

Design the object model for a snack vending machine. A customer inserts money, picks a product by
its slot code, receives the product and any change. They can also cancel and get their money back.
An operator restocks products and empties or refills the coin box.

## What the interviewer tells you if you ask
- About **30 slots**, each holding up to **10 items** of a single product with one price.
- The machine accepts **coins and notes of fixed denominations** (5, 10, 25 cents, 1 and 5 dollars).
- The customer may insert money **before** choosing; inserting several coins is normal.
- If the machine **cannot give exact change**, it must refuse the sale and return the money.
- A slot that is empty must not take the customer's money for that product.
- Only one customer uses the machine at a time, but the operator's maintenance mode must block sales.
- Card payment is a nice-to-have for later.

## Your job
Work through the console stages: scope → API (the public operations) and data (the core domain
objects and their state) → class diagram (v1 core objects → v2 with the abstractions that tame
mode-dependent behaviour) → deep dives (which patterns and why) → wrap-up → signatures (Python
classes and method signatures only). Use the
checklist and ask for tips: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- The same button does different things depending on what has happened so far. Where does that
  logic live without a wall of if/else?
- What are the distinct modes of the machine, and which events move it between them?
- How do you work out change from a limited coin box, and when do you give up?
- How would card payment fit in without rewriting the money handling?
