# How to approach an OOD interview

> Fundamentals · clarify → core objects → class diagram → patterns → code signatures → concurrency & extensibility

A low-level design round ("design a parking lot / elevator / library") is about 45 minutes with
no single right answer. Interviewers grade **the process**: did you pin down scope, find the
right objects, put behaviour in sensible places, and show that the design can grow? A fixed
flow keeps you from drawing classes for a problem you haven't defined yet.

```
 1 clarify ─▶ 2 core objects ─▶ 3 class diagram ─▶ 4 patterns ─▶ 5 signatures ─▶ 6 concurrency
   ~5 min       ~5 min            ~10 min            ~5 min        ~10 min         & extensibility
                                                                                   ~5–10 min
```

## 1. Clarify requirements (≈5 min)

Ask until you can write 4–6 **functional** bullets and 2–3 **non-functional** ones.

- *Who are the actors?* (customer, admin, system clock, external payment)
- *What are the core use cases?* Pick the 3–4 that matter, and say what is **out of scope**.
- *What varies?* Types (vehicle sizes, member tiers), rules (pricing, scheduling), channels
  (notification types). These become your extension points later.
- *Scale and concurrency?* One device or many terminals at once? This decides step 6.

Write the assumptions down: "single building, no reservations, pay on exit".

## 2. Identify core objects (≈5 min)

Go through the use cases. **Nouns → candidate classes**, **verbs → methods**. Then prune:

- primitive-like nouns → fields or **enums** (`Color`, `SpotSize`, `Status`)
- value-like nouns → **value objects** (`Money`, `TimeRange`)
- nouns with identity and lifecycle → **entities** (`Ticket`, `Member`, `Booking`)
- "manager / system" nouns → a thin coordinator. Push real logic onto the entities.

## 3. Class diagram (≈10 min)

Boxes, key fields, key methods, relationships with multiplicity. Mark `«interface»`,
`«abstract»` and `«enum»`. See *UML class & sequence diagrams*. Keep it to 6–12 classes.

## 4. Patterns, only where they earn their place (≈5 min)

Revisit "what varies" from step 1 and attach a pattern to each variation, **naming the
principle**:

- rules that vary → **Strategy** (OCP)
- lifecycle with legal transitions → **State**
- "notify when X" → **Observer**
- choose the class by type → **Factory**
- wrap a vendor → **Adapter**

One or two well-placed patterns beat five name-dropped ones.

## 5. Code signatures (≈10 min)

Write the public classes and method signatures (types, return values, exceptions), and fill
in the one or two most interesting method bodies, e.g. `assign_spot()` or `next_stop()`.
Interviewers want to see that the diagram turns into code.

## 6. Concurrency and extensibility (≈5–10 min)

- **Concurrency:** what shared state exists (free spots, seats, stock)? Which invariant? Where
  does the lock live, and how small is the critical section? See *Concurrency in LLD*.
- **Extensibility:** walk through one likely change ("add EV charging spots", "add a VIP
  tier") and show it touches only new classes plus one registration line.
- **Failure paths:** payment declined, device offline, duplicate request.

Finish with a 30-second summary: the main classes, the patterns and why, and what you'd do
next with more time.
