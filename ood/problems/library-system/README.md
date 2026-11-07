# Design a library management system

> Difficulty: **easy** · Topics: library system, OOD framework, SOLID · ~40 min

Design the object model for a public library's lending system. Members find books in the
catalogue, borrow them, return them, and wait in line for books that are all on loan. Librarians
add books and manage members.

## What the interviewer tells you if you ask
- About **50,000 titles**; popular titles have **several physical copies**, each with its own
  barcode.
- A member may have at most **5 items** out at once; the loan period is **14 days**, renewable
  once if nobody is waiting.
- Returning late costs a **fine per day** (and the library may change how fines work, e.g. a
  cap, or no fines for children's books).
- If every copy is out, a member can **reserve** the title; when a copy comes back, the first
  member in line is notified and has 3 days to pick it up.
- Members search by **title, author or subject**.
- Out of scope: e-books, inter-library loans, the payment provider.

## Your job
Work through the console stages: scope → API (the public operations) and data (the core domain
objects and their state) → class diagram (v1 core objects → v2 with the abstractions that keep
rules swappable) → deep dives (which patterns and why) → wrap-up → signatures (Python
classes and method signatures only). Use the checklist and
ask for tips: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- "Book" means two different things in this prompt. Which objects does that turn into?
- Where do the lending rules (limits, due dates, fines) live so they can change?
- How are waiting members told that a copy is back, without the lending code knowing how?
- What happens when two members try to borrow the last copy at the same desk second?
