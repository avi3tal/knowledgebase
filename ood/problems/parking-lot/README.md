# Design a parking lot

> Difficulty: **easy** · Topics: parking lot, OOD framework, SOLID · ~40 min

Design the object model for a multi-level parking garage. Drivers arrive at an entrance, are let in
if there is room for their vehicle, and pay when they leave through an exit. Staff want to see how
full the garage is.

## What the interviewer tells you if you ask
- **3 levels**, roughly **200 spaces per level**. Spaces come in a few sizes (small, regular, large).
- Vehicles: **motorcycles, cars, vans/trucks**. A motorcycle may use any space; a car needs a
  regular or large space; a truck needs a large one.
- There are **several entrances and exits** that work at the same time.
- Payment is **by the hour**, with a different hourly rate per space size. Card or cash; the
  payment provider itself is out of scope.
- A display board at each entrance shows free spaces per size.
- No reservations, no valet, no EV charging (maybe later).

## Your job
Work through the console stages: scope → API (the public operations) and data (the core domain
objects and their state) → class diagram (evolve it: v1 core objects → v2 with the abstractions
that keep it open to change) → deep dives (which patterns and why) → wrap-up → signatures (Python
classes and method signatures only). Use the
checklist and ask for tips: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Which objects own which state: who knows whether a space is free?
- How is a vehicle matched to a space, and how would you change that rule later?
- How is the fee computed, and what changes if the garage adds a weekend tariff?
- What happens when two entrances try to hand out the last large space at the same moment?
