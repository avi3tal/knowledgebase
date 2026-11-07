# Design an LRU cache (object-oriented)

> Difficulty: **medium** · Topics: LRU cache, concurrency, SOLID · ~45 min

Design a reusable in-process cache library with a fixed capacity. When it is full and a new key
arrives, the entry that was used least recently is removed. Several services in the company will
embed it, so the interface matters as much as the algorithm, and it will be called from many
threads at once.

## What the interviewer tells you if you ask
- Operations: **get(key)** and **put(key, value)**; both should be **O(1)**.
- Capacity is set at construction, e.g. **10,000 entries**; keys are hashable, values arbitrary.
- Least-recently-used is the default, but one team already asks for **LFU** and another for
  **per-entry TTL**; you don't have to build those, but the design must not fight them.
- Called from **dozens of threads**; reads are about **90%** of traffic.
- Callers would like **hit/miss counts** and an optional callback when something is evicted.
- Out of scope: distribution across machines, persistence.

## Your job
Work through the console stages: scope → API (the public operations) and data (the core
structures and their state) → class diagram (v1 core objects → v2 with the abstractions that let
the eviction rule and thread-safety vary) → deep dives (which patterns and why) → wrap-up → signatures (Python
classes and method signatures only). Use the checklist and ask for tips: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Which two structures together give O(1) lookup *and* O(1) "who is oldest?"
- What should callers depend on, so that swapping LRU for LFU does not touch them?
- Even `get` changes state here. What does that mean for locking, and how do you keep 30 threads
  from queueing behind one lock?
- Where do statistics and eviction callbacks hook in without cluttering the core?
