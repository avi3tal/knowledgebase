# Design an elevator system

> Difficulty: **medium** · Topics: elevator system, behavioral patterns, concurrency · ~45 min

Design the object model for the elevators of an office building. People on a floor press up or
down to call an elevator; once inside, they press the button for their destination floor. The
system decides which car answers each call and in which order each car stops.

## What the interviewer tells you if you ask
- **20 floors**, a bank of **4 elevator cars** serving all floors.
- Each car carries up to **8 people / 640 kg**; an overloaded car must not move.
- Hall buttons are **up** and **down** on each floor; cars have one button per floor plus
  door-open, door-close and an emergency stop.
- At morning rush most calls come from the lobby going up; the building manager would like to try
  different dispatching policies (e.g. one tuned for rush hour) without a rewrite.
- Requests arrive **at any time from many floors at once**.
- Out of scope: the motor control hardware, fire-service mode details, destination-dispatch
  keypads.

## Your job
Work through the console stages: scope → API (the public operations) and data (the core domain
objects and their state) → class diagram (v1 core objects → v2 with the abstractions that let the
policy change) → deep dives (which patterns and why) → wrap-up → signatures (Python
classes and method signatures only). Use the checklist and ask
for tips: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Which object decides which car serves a hall call, and how do you swap that policy?
- How does a single car order its pending stops so nobody waits forever?
- What states can a car be in, and which transitions are legal?
- Many threads press buttons while cars move: what is shared, and who guards it?
